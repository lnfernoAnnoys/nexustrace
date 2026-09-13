import type { CaseRecord } from "@/types";

export const cases: CaseRecord[] = [
  {
    id: "case-2026-0091",
    title: "Operation Blackwire",
    category: "Interstate Narcotics Network",
    status: "active",
    priority: "critical",
    description:
      "Multi-state investigation into a narcotics trafficking network moving synthetic drugs from the Punjab border through Delhi-NCR distribution hubs. Believed to involve a corrupt customs contact and at least two logistics front companies.",
    entityIds: [],
    assignedInvestigators: [
      { name: "Inspector A. Sharma", badge: "IPS-4471", initials: "AS" },
      { name: "SI R. Deshmukh", badge: "SI-2290", initials: "RD" },
    ],
    createdAt: "2026-04-02T09:00:00+05:30",
    updatedAt: "2026-09-10T18:22:00+05:30",
  },
  {
    id: "case-2026-0147",
    title: "Hawala Transaction Ring",
    category: "Financial Crime / Money Laundering",
    status: "active",
    priority: "high",
    description:
      "Suspected hawala network laundering proceeds through shell trading and real-estate companies. Financial intelligence indicates layered transactions across five accounts and links into Operation Blackwire's cash flow.",
    entityIds: [],
    assignedInvestigators: [
      { name: "Inspector A. Sharma", badge: "IPS-4471", initials: "AS" },
      { name: "SI K. Bhosale", badge: "SI-1187", initials: "KB" },
    ],
    createdAt: "2026-05-14T10:30:00+05:30",
    updatedAt: "2026-09-11T14:05:00+05:30",
  },
  {
    id: "case-2026-0163",
    title: "Cyber Fraud Syndicate — Delhi-NCR",
    category: "Cyber-enabled Financial Fraud",
    status: "under_review",
    priority: "medium",
    description:
      "Organized OTP-fraud and fake-loan-app syndicate operating from a converted call-center in Noida. Victims across 9 states; mule accounts trace back to a fintech shell entity under review.",
    entityIds: [],
    assignedInvestigators: [{ name: "SI P. Krishnan", badge: "SI-3305", initials: "PK" }],
    createdAt: "2026-06-20T11:15:00+05:30",
    updatedAt: "2026-09-08T09:40:00+05:30",
  },
  {
    id: "case-2026-0052",
    title: "Arms Smuggling Nexus",
    category: "Illegal Arms Trafficking",
    status: "closed",
    priority: "high",
    description:
      "Cross-border arms smuggling case, closed after successful interdiction and two convictions. Retained for network analysis — one associate resurfaced with links into Operation Blackwire.",
    entityIds: [],
    assignedInvestigators: [{ name: "Inspector A. Sharma", badge: "IPS-4471", initials: "AS" }],
    createdAt: "2025-11-08T09:00:00+05:30",
    updatedAt: "2026-02-19T16:00:00+05:30",
  },
];
