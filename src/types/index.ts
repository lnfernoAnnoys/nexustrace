export type EntityType =
  | "person"
  | "phone"
  | "vehicle"
  | "organization"
  | "location"
  | "financial_account";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type CaseStatus = "active" | "under_review" | "closed";
export type CasePriority = "low" | "medium" | "high" | "critical";

export interface BaseEntity {
  id: string;
  type: EntityType;
  name: string;
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  caseIds: string[];
  tags?: string[];
  createdAt: string;
  summary: string;
}

export interface PersonEntity extends BaseEntity {
  type: "person";
  aliases: string[];
  dob: string;
  address: string;
  nationality: string;
  occupation: string;
  criminalHistory: string[];
  photoInitials: string;
}

export interface PhoneEntity extends BaseEntity {
  type: "phone";
  number: string;
  carrier: string;
  firstSeen: string;
  lastSeen: string;
  ownerEntityId?: string;
  imei?: string;
}

export interface VehicleEntity extends BaseEntity {
  type: "vehicle";
  plate: string;
  make: string;
  model: string;
  color: string;
  registeredOwnerId?: string;
}

export interface OrganizationEntity extends BaseEntity {
  type: "organization";
  orgType: string;
  registeredAddress: string;
  incorporatedOn: string;
  knownMemberIds: string[];
}

export interface LocationEntity extends BaseEntity {
  type: "location";
  address: string;
  locationType: string;
  coordinates: { lat: number; lng: number };
}

export interface FinancialAccountEntity extends BaseEntity {
  type: "financial_account";
  accountNumber: string;
  bank: string;
  accountType: string;
  holderEntityId?: string;
  balanceEstimate: number;
}

export type Entity =
  | PersonEntity
  | PhoneEntity
  | VehicleEntity
  | OrganizationEntity
  | LocationEntity
  | FinancialAccountEntity;

export type RelationshipType =
  | "call"
  | "sms"
  | "financial_transaction"
  | "association"
  | "co_location"
  | "vehicle_ownership"
  | "family"
  | "business";

export interface Relationship {
  id: string;
  type: RelationshipType;
  sourceId: string;
  targetId: string;
  strength: number; // 1-10, drives edge thickness
  frequency: number; // occurrences
  startDate: string;
  endDate: string;
  evidenceSource: string;
  caseId: string;
  confidence: number; // 0-100
  note?: string;
}

export interface CaseRecord {
  id: string;
  title: string;
  category: string;
  status: CaseStatus;
  priority: CasePriority;
  description: string;
  entityIds: string[];
  assignedInvestigators: { name: string; badge: string; initials: string }[];
  createdAt: string;
  updatedAt: string;
}

export type EventType =
  | "call"
  | "transaction"
  | "sighting"
  | "meeting"
  | "arrest"
  | "filing"
  | "surveillance";

export interface TimelineEvent {
  id: string;
  caseId: string;
  entityIds: string[];
  type: EventType;
  title: string;
  description: string;
  timestamp: string;
  locationName?: string;
}

export type AlertSeverity = "critical" | "high" | "medium";
export type AlertCategory =
  | "financial_anomaly"
  | "communication_anomaly"
  | "movement_anomaly"
  | "network_structure_anomaly";

export interface AIAlert {
  id: string;
  caseId: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  description: string;
  confidence: number;
  timestamp: string;
  entityIds: string[];
  reviewed: boolean;
}

export type EvidenceType =
  | "fir"
  | "cdr"
  | "financial_record"
  | "surveillance_report"
  | "social_media"
  | "criminal_history"
  | "intelligence_report";

export type ExtractionStatus = "pending" | "processing" | "completed";

export interface EvidenceDocument {
  id: string;
  caseId: string;
  type: EvidenceType;
  fileName: string;
  uploadedAt: string;
  extractionStatus: ExtractionStatus;
  sizeKb: number;
  extractedText?: string;
}
