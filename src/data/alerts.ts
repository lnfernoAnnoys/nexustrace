import type { AIAlert } from "@/types";

const BW = "case-2026-0091";
const HW = "case-2026-0147";
const CF = "case-2026-0163";

export const alerts: AIAlert[] = [
  {
    id: "al01", caseId: HW, category: "network_structure_anomaly", severity: "critical",
    title: "Cross-case financial bridge detected",
    description: "An anomalous transfer links the Cyber Fraud Syndicate's nodal account (QuickCash •••7790) directly to the Hawala Transaction Ring's entry point (HDFC •••1187), suggesting the two networks may share a common launderer.",
    confidence: 91, timestamp: "2026-09-11T09:12:00+05:30", entityIds: ["f04", "f01", "p09", "p02"], reviewed: false,
  },
  {
    id: "al02", caseId: HW, category: "financial_anomaly", severity: "critical",
    title: "Circular transaction pattern identified",
    description: "Funds transferred from HDFC •••1187 through three intermediate accounts return to the originating account within 45 days — a classic layering signature.",
    confidence: 88, timestamp: "2026-08-31T16:40:00+05:30", entityIds: ["f01", "f02", "f03", "f05"], reviewed: false,
  },
  {
    id: "al03", caseId: BW, category: "communication_anomaly", severity: "high",
    title: "Unusual late-night call frequency",
    description: "47 calls recorded between Rohan Verma and an unregistered handset between 1:00–4:00 AM over an 18-day period, a pattern inconsistent with declared occupation.",
    confidence: 84, timestamp: "2026-09-05T07:30:00+05:30", entityIds: ["p01", "ph08"], reviewed: false,
  },
  {
    id: "al04", caseId: BW, category: "movement_anomaly", severity: "high",
    title: "Repeated co-location of unrelated suspects",
    description: "Ehsaan Qureshi and Rajesh Thakur, with no declared professional relationship, were co-located near the Attari-Wagah checkpoint on 6 separate occasions outside official duty logs.",
    confidence: 79, timestamp: "2026-08-22T12:00:00+05:30", entityIds: ["p07", "p14", "l02"], reviewed: true,
  },
  {
    id: "al05", caseId: CF, category: "financial_anomaly", severity: "high",
    title: "Mule account fan-in pattern",
    description: "11 distinct low-activity accounts show a synchronized deposit-then-transfer pattern into the QuickCash nodal account within a 72-hour window.",
    confidence: 86, timestamp: "2026-07-16T10:00:00+05:30", entityIds: ["f04", "p11"], reviewed: true,
  },
  {
    id: "al06", caseId: BW, category: "network_structure_anomaly", severity: "high",
    title: "New high-centrality node emerging",
    description: "Aditya Malhotra's connection count has grown 3x in 60 days and now bridges two previously separate case networks — recommend priority profiling.",
    confidence: 90, timestamp: "2026-09-01T08:00:00+05:30", entityIds: ["p02"], reviewed: false,
  },
  {
    id: "al07", caseId: HW, category: "communication_anomaly", severity: "medium",
    title: "Sudden communication spike before large transfer",
    description: "Call frequency between Aditya Malhotra and Vikram Oberoi tripled in the 72 hours preceding each of the last 4 large transfers.",
    confidence: 75, timestamp: "2026-08-28T14:20:00+05:30", entityIds: ["p02", "p06"], reviewed: false,
  },
  {
    id: "al08", caseId: CF, category: "movement_anomaly", severity: "medium",
    title: "Dormant location reactivated",
    description: "The Noida Sector 63 location, dormant per utility records for 8 months, shows renewed high-density device activity consistent with a call-center operation.",
    confidence: 81, timestamp: "2026-06-24T09:00:00+05:30", entityIds: ["l04"], reviewed: true,
  },
  {
    id: "al09", caseId: BW, category: "financial_anomaly", severity: "medium",
    title: "Invoice over-billing pattern",
    description: "Freight invoices from Bansal Freight & Logistics show line-item values 30-40% above market rate for comparable routes, consistent with a layering technique.",
    confidence: 68, timestamp: "2026-08-16T00:00:00+05:30", entityIds: ["o01", "p02"], reviewed: false,
  },
  {
    id: "al10", caseId: BW, category: "network_structure_anomaly", severity: "medium",
    title: "Historical case entity resurfacing",
    description: "Salim Ansari and Ehsaan Qureshi, both linked to the closed Arms Smuggling Nexus, have resumed contact — recommend reviewing the closed case for reusable leads.",
    confidence: 73, timestamp: "2026-05-15T00:00:00+05:30", entityIds: ["p20", "p07"], reviewed: true,
  },
  {
    id: "al11", caseId: HW, category: "communication_anomaly", severity: "medium",
    title: "Family-linked trusted channel",
    description: "Ayesha Khan's communications with Vikram Oberoi show unusually high trust indicators (call duration, off-hours access) consistent with the newly confirmed family relationship.",
    confidence: 77, timestamp: "2026-09-02T11:00:00+05:30", entityIds: ["p06", "p15"], reviewed: false,
  },
  {
    id: "al12", caseId: CF, category: "network_structure_anomaly", severity: "medium",
    title: "Peripheral recruiter showing rising centrality",
    description: "Arjun Bhatt's connections to mule accounts have doubled in 30 days, suggesting an expanding recruitment operation rather than a peripheral role.",
    confidence: 64, timestamp: "2026-08-05T00:00:00+05:30", entityIds: ["p11"], reviewed: true,
  },
];
