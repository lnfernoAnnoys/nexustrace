import { ExternalLink } from "lucide-react";
import type { SocialProfile } from "@/types";
import { cn } from "@/lib/utils";

const PLATFORM_STYLE: Record<string, { tag: string; color: string }> = {
  X: { tag: "X", color: "#e2e8f0" },
  Instagram: { tag: "IG", color: "#f472b6" },
  Facebook: { tag: "FB", color: "#60a5fa" },
  YouTube: { tag: "YT", color: "#f87171" },
  LinkedIn: { tag: "in", color: "#38bdf8" },
  Telegram: { tag: "TG", color: "#22d3ee" },
  WhatsApp: { tag: "WA", color: "#4ade80" },
  Snapchat: { tag: "SC", color: "#facc15" },
};

export function PlatformTag({ platform, className }: { platform: string; className?: string }) {
  const s = PLATFORM_STYLE[platform] ?? { tag: platform.slice(0, 2), color: "#94a3b8" };
  return (
    <span
      className={cn("mono inline-flex h-5 min-w-6 items-center justify-center rounded px-1 text-[10px] font-bold", className)}
      style={{ color: s.color, backgroundColor: `${s.color}22`, border: `1px solid ${s.color}44` }}
      title={platform}
    >
      {s.tag}
    </span>
  );
}

/** A documented account as a link that opens the real profile in a new tab. */
export function ProfileLink({ profile }: { profile: SocialProfile }) {
  const shown = profile.platform === "YouTube" && profile.handle.startsWith("UC") ? "channel" : `@${profile.handle}`;
  return (
    <a
      href={profile.url}
      target="_blank"
      rel="noreferrer noopener"
      title={`Open ${profile.platform}: ${profile.url}`}
      className="group inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-panel-hover/40 py-1 pl-1 pr-2 text-xs text-text-secondary transition-colors hover:border-border-strong hover:text-cyan-300"
    >
      <PlatformTag platform={profile.platform} />
      <span className="truncate">{shown}</span>
      <ExternalLink size={10} className="shrink-0 text-text-muted group-hover:text-cyan-300" />
    </a>
  );
}
