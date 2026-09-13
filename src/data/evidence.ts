import type { EvidenceDocument } from "@/types";

const BW = "case-2026-0091";
const HW = "case-2026-0147";
const CF = "case-2026-0163";

export const evidenceDocuments: EvidenceDocument[] = [
  {
    id: "ev01", caseId: BW, type: "fir", fileName: "FIR_2026_0091_SectorGGN_PS.pdf",
    uploadedAt: "2026-04-02T10:15:00+05:30", extractionStatus: "completed", sizeKb: 842,
    extractedText:
      "On 02.04.2026, acting on credible information, a team led by Inspector A. Sharma conducted surveillance near Plot 14, Sector 21, Gurugram, Haryana. The informant identified the warehouse as a suspected storage point being used by one Rohan Verma, resident of Ashoka Enclave, Faridabad, for movement of contraband via vehicle DL-01-AB-4471. Verma was seen coordinating with an individual believed to be Sunil Kadam of Sector 14, Gurugram. Further surveillance is recommended before action.",
  },
  {
    id: "ev02", caseId: BW, type: "cdr", fileName: "CDR_ROHAN_VERMA_APR-SEP2026.xlsx",
    uploadedAt: "2026-04-15T11:00:00+05:30", extractionStatus: "completed", sizeKb: 1284,
  },
  {
    id: "ev03", caseId: BW, type: "surveillance_report", fileName: "SURV_SECTOR21_WAREHOUSE_WK18.pdf",
    uploadedAt: "2026-05-06T09:30:00+05:30", extractionStatus: "completed", sizeKb: 3120,
    extractedText:
      "Field team observed a meeting between Rohan Verma and an unidentified male, later confirmed via cross-reference as Ehsaan Qureshi, at a farmhouse property in rural Sonipat district on the evening of 10.05.2026. The meeting lasted approximately 70 minutes. A grey Mahindra Scorpio bearing registration RJ-14-QF-3390 was parked at the location throughout.",
  },
  {
    id: "ev04", caseId: HW, type: "financial_record", fileName: "STR_HDFC_1187_ADITYA_MALHOTRA.pdf",
    uploadedAt: "2026-05-21T14:00:00+05:30", extractionStatus: "completed", sizeKb: 640,
    extractedText:
      "Suspicious Transaction Report filed by HDFC Bank regarding account XXXXXXXX1187 held by Aditya Malhotra. Analysis identifies a recurring transfer pattern of ₹18–25 lakh to account XXXXXXXX2214 held by Oberoi Bullion & Forex, with no corresponding invoiced trade activity on record.",
  },
  {
    id: "ev05", caseId: HW, type: "intelligence_report", fileName: "FIU_INTEL_HAWALA_RING_Q3.pdf",
    uploadedAt: "2026-06-02T10:45:00+05:30", extractionStatus: "processing", sizeKb: 2210,
  },
  {
    id: "ev06", caseId: CF, type: "social_media", fileName: "SMI_QUICKCASH_LOANAPP_REVIEWS.json",
    uploadedAt: "2026-07-01T16:20:00+05:30", extractionStatus: "completed", sizeKb: 96,
    extractedText:
      "Aggregated victim complaints from app-store reviews and social media reports reference a loan application distributed under the QuickCash Fintech Solutions brand. Multiple reports describe harassment calls originating from numbers later traced to the Sector 63, Noida location, with callers identifying themselves using aliases matching known associates of Naveen Reddy.",
  },
  {
    id: "ev07", caseId: CF, type: "criminal_history", fileName: "CRIMHIST_NAVEEN_REDDY.pdf",
    uploadedAt: "2026-06-21T08:00:00+05:30", extractionStatus: "completed", sizeKb: 410,
  },
  {
    id: "ev08", caseId: BW, type: "cdr", fileName: "CDR_UNREGISTERED_BURNER_98999XXXXX.xlsx",
    uploadedAt: "2026-09-06T13:10:00+05:30", extractionStatus: "pending", sizeKb: 220,
  },
  {
    id: "ev09", caseId: HW, type: "financial_record", fileName: "BANKSTMT_MERIDIAN_ESCROW_5541.pdf",
    uploadedAt: "2026-08-20T09:00:00+05:30", extractionStatus: "processing", sizeKb: 1560,
  },
  {
    id: "ev10", caseId: CF, type: "intelligence_report", fileName: "INTEL_MULE_NETWORK_TRACE.pdf",
    uploadedAt: "2026-07-14T15:30:00+05:30", extractionStatus: "completed", sizeKb: 980,
  },
];
