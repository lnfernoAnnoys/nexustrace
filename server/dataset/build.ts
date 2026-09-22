// Small builders for the case dataset. Every risk score is the sum of listed factors, so the reason for a
// score can always be shown next to it.
import type {
  FinancialAccountEntity,
  ImageRef,
  LocationEntity,
  OrganizationEntity,
  PersonEntity,
  RiskFactor,
  RiskLevel,
  SourceLink,
  VehicleEntity,
} from "../../src/types/index.ts";

export const F = (label: string, points: number, detail: string): RiskFactor => ({ label, points, detail });

export function scoreOf(factors: RiskFactor[]): number {
  return Math.max(0, Math.min(100, Math.round(factors.reduce((sum, f) => sum + f.points, 0))));
}

export function levelOf(score: number): RiskLevel {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export const wiki = (title: string, page: string): SourceLink => ({
  title,
  url: `https://en.wikipedia.org/wiki/${page}`,
  publisher: "Wikipedia",
});

export const link = (publisher: string, title: string, url: string): SourceLink => ({ publisher, title, url });

/** A Wikimedia Commons picture. `file` is the file name exactly as on Commons. */
export const commons = (file: string, caption: string, credit: string, license: string): ImageRef => ({
  url: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=900`,
  caption,
  credit,
  license,
  pageUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, "_"))}`,
});

interface Common {
  id: string;
  name: string;
  caseIds: string[];
  /** When this entity entered the case (ISO date). */
  date: string;
  /** One line shown in lists and cards. */
  line: string;
  role: string;
  status?: string;
  description?: string;
  factors: RiskFactor[];
  sources?: SourceLink[];
  image?: ImageRef;
  tags?: string[];
}

function base(o: Common) {
  const riskScore = scoreOf(o.factors);
  return {
    id: o.id,
    name: o.name,
    caseIds: o.caseIds,
    createdAt: `${o.date}T00:00:00+05:30`,
    summary: o.line,
    role: o.role,
    legalStatus: o.status,
    description: o.description ?? o.line,
    riskFactors: o.factors,
    riskScore,
    riskLevel: levelOf(riskScore),
    sources: o.sources,
    image: o.image,
    tags: o.tags,
  };
}

const initials = (name: string) =>
  name
    .replace(/[^A-Za-z .]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function person(
  o: Common & {
    /** Publicly known birth year or date, if any. */
    born?: string;
    /** City / country as publicly reported. Never a home address. */
    based: string;
    occupation: string;
    nationality?: string;
    /** Legal proceedings from public records, oldest first. */
    proceedings?: string[];
    aliases?: string[];
  },
): PersonEntity {
  return {
    ...base(o),
    type: "person",
    aliases: o.aliases ?? [],
    dob: o.born ?? "",
    address: o.based,
    nationality: o.nationality ?? "Indian",
    occupation: o.occupation,
    criminalHistory: o.proceedings ?? [],
    photoInitials: initials(o.name),
  };
}

export function org(o: Common & { orgType: string; address: string; founded?: string; members?: string[] }): OrganizationEntity {
  return {
    ...base(o),
    type: "organization",
    orgType: o.orgType,
    registeredAddress: o.address,
    incorporatedOn: o.founded ?? "",
    knownMemberIds: o.members ?? [],
  };
}

export function place(o: Common & { address: string; kind: string; lat: number; lng: number }): LocationEntity {
  return {
    ...base(o),
    type: "location",
    address: o.address,
    locationType: o.kind,
    coordinates: { lat: o.lat, lng: o.lng },
  };
}

export function account(
  o: Common & { number: string; bank: string; kind: string; holderId?: string; amount: number },
): FinancialAccountEntity {
  return {
    ...base(o),
    type: "financial_account",
    accountNumber: o.number,
    bank: o.bank,
    accountType: o.kind,
    holderEntityId: o.holderId,
    balanceEstimate: o.amount,
  };
}

export function vehicle(o: Common & { plate: string; make: string; model: string; color?: string; ownerId?: string }): VehicleEntity {
  return {
    ...base(o),
    type: "vehicle",
    plate: o.plate,
    make: o.make,
    model: o.model,
    color: o.color ?? "",
    registeredOwnerId: o.ownerId,
  };
}
