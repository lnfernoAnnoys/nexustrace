import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AtSign, BadgeCheck, Building2, Search, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/shared/StatCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { EntityIconBadge } from "@/components/shared/EntityIcon";
import { PlatformTag, ProfileLink } from "@/components/social/SocialLinks";
import { cases, getEntity } from "@/data";
import { socialInfo, useDataVersion } from "@/data/store";
import { knownProfiles, SOCIAL_STATUSES, SOCIAL_STATUS_LABEL, socialRows, type SocialStatus } from "@/data/social";
import { extractHandles, matchKnown, type HandleHit } from "@/nlp/handles";
import { tr } from "@/i18n";

// A made-up post and notice, only to show what the handle finder does. Not real accounts (except the two public ones it matches).
const SAMPLE =
  "The complaint attaches a screenshot of a post by @thevijaymallya on Twitter dated 2 March 2016. The bank's public notice was also shared at https://x.com/pnbindia and on Instagram id: pnbindia. " +
  "A separate Telegram handle @quick_returns_2013 was promoting the scheme; complainants said it was opened on 12.04.2013.";

export default function SocialIntelligence() {
  const version = useDataVersion();
  const [caseFilter, setCaseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | SocialStatus>("all");
  const [query, setQuery] = useState("");
  const [text, setText] = useState("");
  const [hits, setHits] = useState<HandleHit[] | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rows = useMemo(() => socialRows(), [version]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const known = useMemo(() => knownProfiles(), [version]);

  const counts = useMemo(() => {
    const c = { found: 0, none: 0, not_searched: 0, profiles: 0 };
    for (const r of rows) {
      c[r.status]++;
      if (r.status === "found") c.profiles += r.presence?.profiles.length ?? 0;
    }
    return c;
  }, [rows]);

  const shown = useMemo(
    () =>
      rows
        .filter((r) => caseFilter === "all" || r.entity.caseIds.includes(caseFilter))
        .filter((r) => statusFilter === "all" || r.status === statusFilter)
        .filter((r) => r.entity.name.toLowerCase().includes(query.toLowerCase()))
        // accounts first, then the names that were checked, then the rest
        .sort((a, b) => ["found", "none", "not_searched"].indexOf(a.status) - ["found", "none", "not_searched"].indexOf(b.status) || b.entity.riskScore - a.entity.riskScore),
    [rows, caseFilter, statusFilter, query],
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold text-text">{tr("soc.title")}</h1>
        <p className="text-xs text-text-secondary">{tr("soc.subtitle")}</p>
      </div>

      <Card className="border-cyan-500/20 bg-cyan-500/5">
        <CardContent className="flex gap-3 p-4">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-cyan-400" />
          <div className="text-xs leading-relaxed text-text-secondary">
            <p className="font-medium text-text">{tr("soc.how")}</p>
            <p className="mt-1">{tr("soc.how1", { date: socialInfo.fetchedOn || "…" })}</p>
            <p className="mt-1">{tr("soc.how2")}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={tr("soc.stat.names")} value={rows.length} icon={Users} accent="cyan" trend={tr("soc.stat.namesTrend")} />
        <StatCard label={tr("soc.stat.found")} value={counts.found} icon={BadgeCheck} accent="green" trend={tr("soc.stat.foundTrend", { n: counts.profiles })} />
        <StatCard label={tr("soc.stat.none")} value={counts.none} icon={Building2} accent="amber" trend={tr("soc.stat.noneTrend")} />
        <StatCard label={tr("soc.stat.notSearched")} value={counts.not_searched} icon={ShieldCheck} accent="cyan" trend={tr("soc.stat.notSearchedTrend")} />
      </div>

      <Card>
        <CardHeader>
          <SectionHeader
            title={tr("soc.finder")}
            description={tr("soc.finderDesc")}
            action={
              <Button size="sm" variant="secondary" onClick={() => { setText(SAMPLE); setHits(null); }}>
                {tr("soc.loadSample")}
              </Button>
            }
          />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Textarea value={text} onChange={(e) => { setText(e.target.value); setHits(null); }} rows={4} className="text-xs" placeholder={tr("soc.pastePh")} aria-label={tr("soc.pasteAria")} />
          <div>
            <Button size="sm" onClick={() => setHits(extractHandles(text))} disabled={!text.trim()}>
              <AtSign size={13} /> {tr("soc.findBtn")}
            </Button>
          </div>
          {hits && (
            <div className="flex flex-col gap-1.5">
              {hits.length === 0 && <p className="text-xs text-text-muted">{tr("soc.noHandles")}</p>}
              {hits.map((h, i) => {
                const m = matchKnown(h, known);
                const owner = m ? getEntity(m.entityId) : undefined;
                return (
                  <div key={`${h.start}-${i}`} className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-panel-hover/30 px-3 py-2 text-xs">
                    <PlatformTag platform={h.platform === "Unspecified" ? "?" : h.platform} />
                    <span className="mono text-text">@{h.handle}</span>
                    {h.platform === "Unspecified" && <span className="text-[11px] text-text-muted">{tr("soc.noPlatform")}</span>}
                    <span className="ml-auto flex items-center gap-2">
                      {owner ? (
                        <>
                          <Badge variant="green">{tr("soc.matches")}</Badge>
                          <Link to={`/entities/${owner.type}/${owner.id}`} className="text-cyan-300 hover:underline">
                            {owner.name}
                          </Link>
                        </>
                      ) : (
                        <Badge variant="amber">{tr("soc.unmatched")}</Badge>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <SectionHeader
            title={tr("soc.names")}
            description={tr("soc.shown", { n: shown.length, total: rows.length })}
            action={
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-48">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tr("soc.searchPh")} className="pl-8" aria-label={tr("soc.searchPh")} />
                </div>
                <Select value={caseFilter} onValueChange={setCaseFilter}>
                  <SelectTrigger className="w-52" aria-label={tr("net.f.case")}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{tr("net.f.allCases")}</SelectItem>
                    {cases.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | SocialStatus)}>
                  <SelectTrigger className="w-44" aria-label={tr("common.status")}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{tr("cases.allStatuses")}</SelectItem>
                    {SOCIAL_STATUSES.map((s) => <SelectItem key={s} value={s}>{SOCIAL_STATUS_LABEL[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            }
          />
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tr("common.name")}</TableHead>
              <TableHead>{tr("common.cases")}</TableHead>
              <TableHead>{tr("common.status")}</TableHead>
              <TableHead>{tr("soc.col.accounts")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((r) => (
              <TableRow key={r.entity.id}>
                <TableCell>
                  <Link to={`/entities/${r.entity.type}/${r.entity.id}`} className="flex items-center gap-2.5">
                    <EntityIconBadge type={r.entity.type} size={28} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-text">{r.entity.name}</span>
                      {r.entity.role && <span className="block max-w-56 truncate text-[10px] text-text-muted">{r.entity.role}</span>}
                    </span>
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {r.entity.caseIds.map((cid) => <Badge key={cid} variant="outline" className="mono">{cid}</Badge>)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={r.status === "found" ? "green" : r.status === "none" ? "amber" : "outline"}>{SOCIAL_STATUS_LABEL[r.status]}</Badge>
                </TableCell>
                <TableCell className="max-w-md">
                  {r.status === "found" && r.presence ? (
                    <div className="flex flex-wrap gap-1.5">
                      {r.presence.profiles.map((p) => <ProfileLink key={`${p.platform}:${p.handle}`} profile={p} />)}
                    </div>
                  ) : (
                    <span className="text-[11px] text-text-muted">{r.reason}</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {shown.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-xs text-text-muted">{tr("soc.noMatch")}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
