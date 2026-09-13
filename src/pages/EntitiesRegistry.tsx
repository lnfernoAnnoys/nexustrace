import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Search, LayoutGrid, List as ListIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { EntityIconBadge } from "@/components/shared/EntityIcon";
import { allEntities, ENTITY_TYPE_LABEL, getRelationshipsForEntity, getCase } from "@/data";
import type { EntityType } from "@/types";
import { cn } from "@/lib/utils";

export default function EntitiesRegistry() {
  const { type } = useParams<{ type: string }>();
  const entityType = type as EntityType;
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [view, setView] = useState<"table" | "grid">("table");

  const items = useMemo(() => {
    return allEntities
      .filter((e) => e.type === entityType)
      .filter((e) => e.name.toLowerCase().includes(query.toLowerCase()))
      .filter((e) => riskFilter === "all" || e.riskLevel === riskFilter);
  }, [entityType, query, riskFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-text">{ENTITY_TYPE_LABEL[entityType]}</h1>
        <p className="text-xs text-text-secondary">{items.length} of {allEntities.filter((e) => e.type === entityType).length} records</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-64">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${ENTITY_TYPE_LABEL[entityType].toLowerCase()}…`} className="pl-8" />
        </div>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-1 rounded-md border border-border bg-panel p-1">
          <button onClick={() => setView("table")} className={cn("rounded p-1.5", view === "table" ? "bg-panel-hover text-cyan-300" : "text-text-muted")}>
            <ListIcon size={14} />
          </button>
          <button onClick={() => setView("grid")} className={cn("rounded p-1.5", view === "grid" ? "bg-panel-hover text-cyan-300" : "text-text-muted")}>
            <LayoutGrid size={14} />
          </button>
        </div>
      </div>

      {view === "table" ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Connections</TableHead>
                <TableHead>Cases</TableHead>
                <TableHead>Summary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <Link to={`/entities/${e.type}/${e.id}`} className="flex items-center gap-2.5">
                      <EntityIconBadge type={e.type} size={30} />
                      <span className="mono font-medium text-text">{e.name}</span>
                    </Link>
                  </TableCell>
                  <TableCell><RiskBadge level={e.riskLevel} /></TableCell>
                  <TableCell className="mono">{getRelationshipsForEntity(e.id).length}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {e.caseIds.map((cid) => (
                        <Badge key={cid} variant="outline" className="mono">{getCase(cid)?.id}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md truncate text-text-secondary">{e.summary}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((e) => (
            <Link key={e.id} to={`/entities/${e.type}/${e.id}`}>
              <Card className="h-full p-4 transition-colors hover:border-border-strong">
                <div className="flex items-center gap-2.5">
                  <EntityIconBadge type={e.type} size={34} />
                  <div className="min-w-0">
                    <p className="mono truncate text-sm font-medium text-text">{e.name}</p>
                    <RiskBadge level={e.riskLevel} />
                  </div>
                </div>
                <p className="mt-2.5 line-clamp-2 text-xs text-text-secondary">{e.summary}</p>
                <div className="mt-3 flex items-center justify-between text-[10px] text-text-muted">
                  <span>{getRelationshipsForEntity(e.id).length} connections</span>
                  <span>{e.caseIds.length} case(s)</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
