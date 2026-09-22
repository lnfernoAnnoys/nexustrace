import { Link } from "react-router-dom";
import { ExternalLink, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { socialInfo } from "@/data/store";
import { SOCIAL_STATUS_LABEL, socialRowFor } from "@/data/social";
import type { OrganizationEntity, PersonEntity } from "@/types";
import { ProfileLink } from "./SocialLinks";
import { tr } from "@/i18n";

/** The "Social media presence" card on a person's or organisation's page. */
export function SocialCard({ entity }: { entity: PersonEntity | OrganizationEntity }) {
  const row = socialRowFor(entity);
  const p = row.presence;
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{tr("soc.card.title")}</CardTitle>
        <Badge variant={row.status === "found" ? "green" : row.status === "none" ? "amber" : "outline"}>{SOCIAL_STATUS_LABEL[row.status]}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {row.status === "found" && p ? (
          <>
            <div className="flex flex-wrap gap-2">
              {p.profiles.map((pr) => (
                <ProfileLink key={`${pr.platform}:${pr.handle}`} profile={pr} />
              ))}
              {p.website && (
                <a href={p.website} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-panel-hover/40 px-2 py-1 text-xs text-text-secondary hover:border-border-strong hover:text-cyan-300">
                  <Globe size={12} /> {tr("soc.card.website")} <ExternalLink size={10} className="text-text-muted" />
                </a>
              )}
            </div>
            <p className="text-[11px] leading-relaxed text-text-muted">
              {tr("soc.card.source", { label: p.label })}{" "}
              <a href={`https://www.wikidata.org/wiki/${p.wikidataId}`} target="_blank" rel="noreferrer noopener" className="text-cyan-400 hover:underline">
                Wikidata {p.wikidataId}
              </a>
              {socialInfo.fetchedOn && <>. {tr("soc.card.copied", { date: socialInfo.fetchedOn })}</>} {tr("soc.card.caution")}
            </p>
          </>
        ) : (
          <p className="text-xs leading-relaxed text-text-secondary">{row.reason}</p>
        )}
        <Link to="/social" className="text-[11px] text-cyan-400 hover:underline">
          {tr("soc.card.seeAll")}
        </Link>
      </CardContent>
    </Card>
  );
}
