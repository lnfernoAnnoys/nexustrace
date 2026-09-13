import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import ForceGraph2D, { type ForceGraphMethods, type NodeObject, type LinkObject } from "react-force-graph-2d";
import type { Entity, Relationship, RiskLevel } from "@/types";
import { ENTITY_TYPE_COLOR, RISK_COLOR, RELATIONSHIP_TYPE_COLOR, RELATIONSHIP_TYPE_DASH } from "@/data";

export type GraphLayout = "force" | "circular" | "risk";

type GNode = NodeObject<Entity>;
type GLink = LinkObject<Entity, Relationship>;

export interface NetworkGraphHandle {
  zoomToFit: (durationMs?: number) => void;
  reheat: () => void;
}

interface NetworkGraphProps {
  entities: Entity[];
  relationships: Relationship[];
  selectedId?: string | null;
  onSelectNode?: (id: string | null) => void;
  onHoverNode?: (id: string | null) => void;
  highlightIds?: Set<string>;
  pathNodeIds?: Set<string>;
  pathEdgeIds?: Set<string>;
  layout?: GraphLayout;
  height?: number | string;
}

/**
 * A soft "target position" d3-force: nudges each node's velocity toward a target
 * point instead of pinning it outright (fx/fy), so charge/link forces and node
 * dragging stay fully live — nodes settle into the target arrangement but keep
 * springing and reacting like the plain force layout does.
 *
 * Implemented as a proper d3-force (with `.initialize`) rather than closing over
 * our own node array: d3-force calls `initialize(simulationNodes)` with the exact
 * array the simulation mutates, which is what must be read/written here — the
 * array we construct for the `graphData` prop is a separate object.
 */
function createLayoutForce(target: (n: GNode) => { x: number; y: number } | null, strength: number) {
  let simNodes: GNode[] = [];
  const force = (alpha: number) => {
    for (const n of simNodes) {
      const t = target(n);
      if (!t) continue;
      const x = n.x ?? 0;
      const y = n.y ?? 0;
      n.vx = (n.vx ?? 0) + (t.x - x) * strength * alpha;
      n.vy = (n.vy ?? 0) + (t.y - y) * strength * alpha;
    }
  };
  force.initialize = (nodes: GNode[]) => {
    simNodes = nodes;
  };
  return force;
}

// Hoisted to module scope so these accessor functions are stable across every
// render — they don't depend on component state, and react-force-graph's
// underlying kapsule pauses/resets the simulation whenever ANY prop reference
// changes, so recreating these inline on every render was quietly killing the
// physics (drags never sprang back, layouts never got a chance to settle).
function staticLinkLineDash(link: GLink): number[] | null {
  const rel = link as unknown as Relationship;
  return RELATIONSHIP_TYPE_DASH[rel.type];
}

function staticLinkDirectionalArrowLength(link: GLink): number {
  const rel = link as unknown as Relationship;
  return rel.type === "financial_transaction" ? 4 : 0;
}

function staticLinkDirectionalArrowColor(link: GLink): string {
  const rel = link as unknown as Relationship;
  return RELATIONSHIP_TYPE_COLOR[rel.type] ?? "#93a1b8";
}

function glyphFor(e: Entity): string {
  switch (e.type) {
    case "person":
      return e.photoInitials;
    case "phone":
      return "PH";
    case "vehicle":
      return "VH";
    case "organization":
      return "OR";
    case "location":
      return "LO";
    case "financial_account":
      return "FA";
    default:
      return "?";
  }
}

export const NetworkGraph = forwardRef<NetworkGraphHandle, NetworkGraphProps>(function NetworkGraph(
  {
    entities,
    relationships,
    selectedId = null,
    onSelectNode,
    onHoverNode,
    highlightIds,
    pathNodeIds,
    pathEdgeIds,
    layout = "force",
    height = "100%",
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<ForceGraphMethods<Entity, Relationship> | undefined>(undefined);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const graphData = useMemo(() => {
    const nodes: GNode[] = entities.map((e) => ({ ...e }));
    const links: GLink[] = relationships
      .filter((r) => entities.some((e) => e.id === r.sourceId) && entities.some((e) => e.id === r.targetId))
      .map((r) => ({ ...r, source: r.sourceId, target: r.targetId }) as unknown as GLink);
    return { nodes, links };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entities, relationships]);

  const degree = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entities) map.set(e.id, 0);
    for (const r of relationships) {
      if (map.has(r.sourceId)) map.set(r.sourceId, (map.get(r.sourceId) ?? 0) + 1);
      if (map.has(r.targetId)) map.set(r.targetId, (map.get(r.targetId) ?? 0) + 1);
    }
    return map;
  }, [entities, relationships]);

  const neighborSet = useMemo(() => {
    const activeId = hoveredId ?? selectedId;
    if (!activeId) return null;
    const set = new Set<string>([activeId]);
    for (const r of relationships) {
      if (r.sourceId === activeId) set.add(r.targetId);
      if (r.targetId === activeId) set.add(r.sourceId);
    }
    return set;
  }, [hoveredId, selectedId, relationships]);

  useImperativeHandle(ref, () => ({
    zoomToFit: (durationMs = 500) => fgRef.current?.zoomToFit(durationMs, 60),
    reheat: () => fgRef.current?.d3ReheatSimulation(),
  }));

  // Register a soft layout-shaping force per mode. Nodes are never hard-pinned
  // (no fx/fy), so dragging, charge repulsion and link tension keep working in
  // every layout — circular/risk rings stay just as interactive as free force.
  useEffect(() => {
    const nodes = graphData.nodes;

    if (layout === "circular") {
      const sorted = [...nodes].sort((a, b) => (a.type as string).localeCompare(b.type as string));
      const angleById = new Map<string, number>();
      sorted.forEach((n, i) => angleById.set(n.id as string, (i / sorted.length) * Math.PI * 2));
      const R = Math.max(180, sorted.length * 11);
      fgRef.current?.d3Force(
        "layout",
        createLayoutForce((n) => {
          const angle = angleById.get(n.id as string) ?? 0;
          return { x: R * Math.cos(angle), y: R * Math.sin(angle) };
        }, 0.35),
      );
    } else if (layout === "risk") {
      const radii: Record<RiskLevel, number> = { critical: 50, high: 130, medium: 210, low: 290 };
      const groups: Record<RiskLevel, GNode[]> = { critical: [], high: [], medium: [], low: [] };
      nodes.forEach((n) => groups[n.riskLevel as RiskLevel].push(n));
      const angleById = new Map<string, number>();
      (Object.keys(groups) as RiskLevel[]).forEach((level) => {
        const group = groups[level];
        group.forEach((n, i) => angleById.set(n.id as string, (i / Math.max(group.length, 1)) * Math.PI * 2));
      });
      fgRef.current?.d3Force(
        "layout",
        createLayoutForce((n) => {
          const angle = angleById.get(n.id as string) ?? 0;
          const R = radii[n.riskLevel as RiskLevel];
          return { x: R * Math.cos(angle), y: R * Math.sin(angle) };
        }, 0.35),
      );
    } else {
      fgRef.current?.d3Force("layout", null);
    }
    fgRef.current?.d3ReheatSimulation();
    const t = setTimeout(() => fgRef.current?.zoomToFit(500, 60), 700);
    return () => clearTimeout(t);
  }, [layout, graphData]);

  useEffect(() => {
    const t = setTimeout(() => fgRef.current?.zoomToFit(500, 60), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphData]);

  const nodeRadius = useCallback(
    (entity: Entity) => {
      const d = degree.get(entity.id) ?? 0;
      const base = 4.2 + Math.sqrt(d + 1) * 2.1;
      const boosted = highlightIds?.has(entity.id) ? base * 1.35 : base;
      return Math.min(boosted, 17);
    },
    [degree, highlightIds],
  );

  const linkColor = useCallback(
    (link: GLink) => {
      const rel = link as unknown as Relationship;
      const isPath = pathEdgeIds?.has(rel.id);
      const dim = neighborSet ? !(neighborSet.has(rel.sourceId) && neighborSet.has(rel.targetId)) : false;
      if (isPath) return "#22d3ee";
      const base = RELATIONSHIP_TYPE_COLOR[rel.type] ?? "#93a1b8";
      if (dim && !isPath) return `${base}22`;
      return `${base}99`;
    },
    [pathEdgeIds, neighborSet],
  );

  const linkWidth = useCallback(
    (link: GLink) => {
      const rel = link as unknown as Relationship;
      const isPath = pathEdgeIds?.has(rel.id);
      if (isPath) return 3.2;
      return Math.max(0.6, (rel.strength / 10) * 2.6);
    },
    [pathEdgeIds],
  );

  const nodeVal = useCallback((node: GNode) => nodeRadius(node as Entity) ** 2, [nodeRadius]);

  const nodePointerAreaPaint = useCallback(
    (node: GNode, color: string, ctx: CanvasRenderingContext2D) => {
      const entity = node as unknown as Entity;
      const r = nodeRadius(entity);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(node.x ?? 0, node.y ?? 0, r + 2, 0, Math.PI * 2);
      ctx.fill();
    },
    [nodeRadius],
  );

  const nodeCanvasObject = useCallback(
    (node: GNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const entity = node as unknown as Entity;
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const r = nodeRadius(entity);
      const isSelected = entity.id === selectedId;
      const isHovered = entity.id === hoveredId;
      const isPath = pathNodeIds?.has(entity.id);
      const isKeyPlayer = highlightIds?.has(entity.id);
      const dimmed = neighborSet ? !neighborSet.has(entity.id) : false;

      ctx.save();
      ctx.globalAlpha = dimmed && !isPath ? 0.18 : 1;

      if (entity.riskLevel === "critical" || entity.riskLevel === "high") {
        ctx.beginPath();
        ctx.arc(x, y, r + 3.2, 0, Math.PI * 2);
        ctx.strokeStyle = RISK_COLOR[entity.riskLevel];
        ctx.lineWidth = entity.riskLevel === "critical" ? 1.8 : 1.1;
        ctx.stroke();
      }

      if (isKeyPlayer) {
        ctx.beginPath();
        ctx.arc(x, y, r + 6, 0, Math.PI * 2);
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 1.4;
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = ENTITY_TYPE_COLOR[entity.type];
      ctx.fill();

      if (isSelected || isPath) {
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
      } else if (isHovered) {
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
      }

      ctx.fillStyle = "#050810";
      ctx.font = `700 ${Math.max(r * 0.72, 3)}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(glyphFor(entity), x, y + 0.3);

      if (globalScale > 1.15 || isSelected || isHovered || isKeyPlayer || isPath) {
        ctx.font = `${11 / globalScale}px Inter, sans-serif`;
        ctx.fillStyle = isSelected || isHovered ? "#e7edf7" : "#93a1b8";
        ctx.fillText(entity.name, x, y + r + 9 / globalScale);
      }

      ctx.restore();
    },
    [nodeRadius, selectedId, hoveredId, pathNodeIds, highlightIds, neighborSet],
  );

  const handleNodeClick = useCallback(
    (node: GNode) => onSelectNode?.((node as unknown as Entity).id),
    [onSelectNode],
  );

  const handleNodeDragEnd = useCallback(() => fgRef.current?.d3ReheatSimulation(), []);

  const handleBackgroundClick = useCallback(() => onSelectNode?.(null), [onSelectNode]);

  const handleNodeHover = useCallback(
    (node: GNode | null) => {
      const id = node ? (node as unknown as Entity).id : null;
      setHoveredId(id);
      onHoverNode?.(id);
    },
    [onHoverNode],
  );

  return (
    <div ref={containerRef} style={{ height }} className="relative w-full">
      <ForceGraph2D
        ref={fgRef}
        width={size.width}
        height={typeof size.height === "number" && size.height > 0 ? size.height : 600}
        graphData={graphData}
        backgroundColor="rgba(0,0,0,0)"
        nodeRelSize={1}
        d3AlphaDecay={0.028}
        d3VelocityDecay={0.32}
        cooldownTime={4000}
        linkColor={linkColor}
        linkWidth={linkWidth}
        linkLineDash={staticLinkLineDash}
        linkDirectionalArrowLength={staticLinkDirectionalArrowLength}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowColor={staticLinkDirectionalArrowColor}
        nodeVal={nodeVal}
        nodePointerAreaPaint={nodePointerAreaPaint}
        nodeCanvasObject={nodeCanvasObject}
        onNodeClick={handleNodeClick}
        onNodeDragEnd={handleNodeDragEnd}
        onBackgroundClick={handleBackgroundClick}
        onNodeHover={handleNodeHover}
        showPointerCursor
        enableNodeDrag
      />
    </div>
  );
});
