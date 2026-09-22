// Social media intelligence, worked out from the stored Wikidata copy (see server/dataset/fetch-social.ts).
// Only people and organisations are considered "names". Nothing here searches the platforms.
import type { OrganizationEntity, PersonEntity, SocialPresence } from "@/types";
import type { KnownProfile } from "@/nlp/handles";
import { allEntities, socialPresence } from "./store";
import { labelMap, tr } from "@/i18n/core";

export type SocialStatus = "found" | "none" | "not_searched";

export interface SocialRow {
  entity: PersonEntity | OrganizationEntity;
  status: SocialStatus;
  presence?: SocialPresence;
  reason: string;
}

export const SOCIAL_STATUSES: SocialStatus[] = ["found", "none", "not_searched"];
export const SOCIAL_STATUS_LABEL = labelMap<SocialStatus>("socstatus");

export function getSocial(entityId: string): SocialPresence | undefined {
  return socialPresence.find((s) => s.entityId === entityId);
}

export function socialRowFor(entity: PersonEntity | OrganizationEntity): SocialRow {
  const presence = getSocial(entity.id);
  if (!presence) {
    return {
      entity,
      status: "not_searched",
      reason: entity.type === "person" ? tr("soc.reason.person") : tr("soc.reason.org"),
    };
  }
  if (presence.deceased) return { entity, status: "none", presence, reason: tr("soc.reason.deceased") };
  if (presence.profiles.length === 0) return { entity, status: "none", presence, reason: tr("soc.reason.none") };
  return { entity, status: "found", presence, reason: tr("soc.reason.found") };
}

/** Every person and organisation in the cases, with what is known about its social media presence. */
export function socialRows(): SocialRow[] {
  return allEntities
    .filter((e): e is PersonEntity | OrganizationEntity => e.type === "person" || e.type === "organization")
    .map(socialRowFor);
}

/** Every documented account, for matching handles found in text. */
export function knownProfiles(): KnownProfile[] {
  return socialPresence
    .filter((s) => !s.deceased)
    .flatMap((s) => s.profiles.map((p) => ({ entityId: s.entityId, platform: p.platform, handle: p.handle, url: p.url })));
}
