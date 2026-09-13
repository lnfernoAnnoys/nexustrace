import type { TimelineEvent } from "@/types";

const BW = "case-2026-0091";
const HW = "case-2026-0147";
const CF = "case-2026-0163";
const AS = "case-2026-0052";

export const events: TimelineEvent[] = [
  { id: "e01", caseId: BW, entityIds: ["p01", "l01"], type: "filing", title: "FIR registered", description: "Initial FIR registered following a tip-off about warehouse activity in Sector 21, Gurugram.", timestamp: "2026-04-02T10:00:00+05:30" },
  { id: "e02", caseId: BW, entityIds: ["p01", "p03"], type: "call", title: "First flagged call intercepted", description: "Call between Rohan Verma and Sunil Kadam flagged by keyword-triggered CDR analysis.", timestamp: "2026-04-06T14:32:00+05:30" },
  { id: "e03", caseId: BW, entityIds: ["p01", "l01"], type: "surveillance", title: "Surveillance team deployed", description: "Physical surveillance established on the Sector 21 warehouse.", timestamp: "2026-04-10T08:00:00+05:30" },
  { id: "e04", caseId: BW, entityIds: ["p14", "l02"], type: "sighting", title: "Customs official sighting", description: "Rajesh Thakur observed processing a consignment outside standard duty hours at Attari-Wagah.", timestamp: "2026-04-21T22:15:00+05:30" },
  { id: "e05", caseId: BW, entityIds: ["p02", "p01"], type: "transaction", title: "First cross-network transfer detected", description: "STR filed by bank flags a transfer from Aditya Malhotra to Rohan Verma.", timestamp: "2026-04-22T00:00:00+05:30" },
  { id: "e06", caseId: BW, entityIds: ["p07", "p14"], type: "transaction", title: "Suspected bribe payment", description: "Cash-deposit pattern consistent with facilitation payment recorded near the border checkpoint.", timestamp: "2026-05-02T00:00:00+05:30" },
  { id: "e07", caseId: BW, entityIds: ["p01", "l05"], type: "meeting", title: "Meeting at farmhouse safehouse", description: "Surveillance recorded a meeting between Rohan Verma and Ehsaan Qureshi at the Sonipat farmhouse.", timestamp: "2026-05-10T19:40:00+05:30" },
  { id: "e08", caseId: BW, entityIds: ["p20", "p07"], type: "sighting", title: "Resurfaced associate identified", description: "Salim Ansari, previously linked to the closed Arms Smuggling case, identified in contact with Ehsaan Qureshi.", timestamp: "2026-05-14T00:00:00+05:30" },
  { id: "e09", caseId: BW, entityIds: ["v01", "l01"], type: "surveillance", title: "Vehicle movement logged", description: "ANPR camera logs DL-01-AB-4471 departing the warehouse at an unusual hour.", timestamp: "2026-06-02T02:10:00+05:30" },
  { id: "e10", caseId: BW, entityIds: ["p01"], type: "sighting", title: "Coordinator location update", description: "Field team confirms Rohan Verma's continued presence in the Faridabad-Gurugram corridor.", timestamp: "2026-07-18T00:00:00+05:30" },
  { id: "e11", caseId: BW, entityIds: ["p01", "p13", "p03"], type: "surveillance", title: "Network mapping milestone", description: "Analyst review consolidates 14 confirmed contacts into the current network graph.", timestamp: "2026-08-20T00:00:00+05:30" },
  { id: "e12", caseId: BW, entityIds: [], type: "filing", title: "Case status reviewed", description: "Case reviewed and escalated to critical priority given cross-case financial links.", timestamp: "2026-09-10T18:22:00+05:30" },

  { id: "e13", caseId: HW, entityIds: ["p06"], type: "filing", title: "Case opened", description: "Case opened based on financial intelligence unit referral regarding Oberoi Bullion & Forex.", timestamp: "2026-05-14T10:30:00+05:30" },
  { id: "e14", caseId: HW, entityIds: ["p02", "p06"], type: "transaction", title: "Large transfer flagged", description: "Suspicious Transaction Report flags a ₹22 lakh transfer between Aditya Malhotra and Vikram Oberoi.", timestamp: "2026-05-20T00:00:00+05:30" },
  { id: "e15", caseId: HW, entityIds: ["p05", "o03"], type: "filing", title: "Shell company identified", description: "Meridian Real Estate Ventures identified as a likely laundering vehicle via MCA filings.", timestamp: "2026-06-01T00:00:00+05:30" },
  { id: "e16", caseId: HW, entityIds: ["p15", "l03"], type: "surveillance", title: "Hawala office surveillance begins", description: "Physical surveillance established at the Karol Bagh office.", timestamp: "2026-05-30T09:00:00+05:30" },
  { id: "e17", caseId: HW, entityIds: ["f01", "f02", "f03", "f05"], type: "transaction", title: "Circular transaction pattern detected", description: "AI financial-pattern analysis flags a four-account circular transfer returning funds to the origin account.", timestamp: "2026-08-31T00:00:00+05:30" },
  { id: "e18", caseId: HW, entityIds: ["p06", "p15"], type: "sighting", title: "Family link confirmed", description: "Public records confirm Ayesha Khan as Vikram Oberoi's niece, explaining her trusted sub-agent role.", timestamp: "2026-09-02T00:00:00+05:30" },
  { id: "e19", caseId: HW, entityIds: [], type: "filing", title: "ED summons issued", description: "Enforcement Directorate issues summons to Vikram Oberoi pending further inquiry.", timestamp: "2026-09-11T14:05:00+05:30" },

  { id: "e20", caseId: CF, entityIds: ["p09", "l04"], type: "filing", title: "Case opened", description: "Case opened after multiple victim complaints traced to a Noida call-center location.", timestamp: "2026-06-20T11:15:00+05:30" },
  { id: "e21", caseId: CF, entityIds: ["p09", "p10", "p17"], type: "surveillance", title: "Key personnel identified", description: "Surveillance and CDR analysis identify the syndicate's core team.", timestamp: "2026-06-27T00:00:00+05:30" },
  { id: "e22", caseId: CF, entityIds: ["p11", "f04"], type: "transaction", title: "Mule account network mapped", description: "Financial trace identifies 11 mule accounts feeding the QuickCash nodal account.", timestamp: "2026-07-15T00:00:00+05:30" },
  { id: "e23", caseId: CF, entityIds: ["f04", "f01"], type: "transaction", title: "Cross-case financial link surfaced", description: "AI network analysis flags an anomalous transfer connecting the Cyber Fraud Syndicate to the Hawala Transaction Ring.", timestamp: "2026-08-29T00:00:00+05:30" },
  { id: "e24", caseId: CF, entityIds: ["l04"], type: "filing", title: "Case placed under review", description: "Case placed under review pending inter-agency coordination given the cross-case financial link.", timestamp: "2026-09-08T09:40:00+05:30" },

  { id: "e25", caseId: AS, entityIds: ["p12"], type: "arrest", title: "Arrest and conviction", description: "Kabir Anand arrested and subsequently convicted under the Arms Act.", timestamp: "2026-01-15T00:00:00+05:30" },
  { id: "e26", caseId: AS, entityIds: ["p20", "p07"], type: "sighting", title: "Associate resurfaces", description: "Salim Ansari and Ehsaan Qureshi identified in renewed contact, prompting a link into Operation Blackwire.", timestamp: "2026-05-14T00:00:00+05:30" },
  { id: "e27", caseId: AS, entityIds: [], type: "filing", title: "Case closed", description: "Case formally closed following convictions; retained for ongoing network analysis.", timestamp: "2026-02-19T16:00:00+05:30" },
];
