import type { EvidenceDocument } from "../../src/types/index.ts";

const M = "mumbai-2008";
const B = "bhopal-1984";
const H = "mehta-1992";
const S = "satyam-2009";
const G = "2g-2008";
const P = "pnb-2018";
const N = "nsel-2013";
const R = "saradha-2013";
const K = "kingfisher-2016";
const A = "agusta-2013";

// Short case summaries written for this system from the public sources listed on each case. They are the text
// the NLP engine reads: run "Extract entities" on any of them to see the people, companies, places and links it finds.
export const evidenceDocuments: EvidenceDocument[] = [
  {
    id: "doc-mumbai-summary", caseId: M, type: "intelligence_report", fileName: "CASE_SUMMARY_2008_MUMBAI_ATTACKS.txt",
    uploadedAt: "2026-09-21T09:00:00+05:30", extractionStatus: "completed", sizeKb: 2,
    sourceName: "Britannica", sourceUrl: "https://www.britannica.com/event/Mumbai-terrorist-attacks-of-2008",
    extractedText:
      "On 26 November 2008 ten Lashkar-e-Taiba gunmen, who had sailed from Karachi and hijacked an Indian fishing trawler, landed in Mumbai and attacked Chhatrapati Shivaji Terminus, the Taj Mahal Palace Hotel, Oberoi Trident Hotel, Leopold Cafe, Nariman House and Cama Hospital. Ajmal Kasab was captured alive by the Mumbai Police and confessed that the group was controlled from Pakistan. Investigators linked Zaki-ur-Rehman Lakhvi, Sajid Mir and Hafiz Saeed to the plot. David Coleman Headley, who scouted the targets together with Tahawwur Hussain Rana, pleaded guilty in the United States and was sentenced to 35 years. Zabiuddin Ansari was captured in July 2012. Kasab was executed on 21 November 2012.",
  },
  {
    id: "doc-bhopal-summary", caseId: B, type: "intelligence_report", fileName: "CASE_SUMMARY_BHOPAL_GAS_DISASTER.txt",
    uploadedAt: "2026-09-21T09:05:00+05:30", extractionStatus: "completed", sizeKb: 2,
    sourceName: "Britannica", sourceUrl: "https://www.britannica.com/event/Bhopal-disaster",
    extractedText:
      "On the night of 2 December 1984 methyl isocyanate gas leaked from the Union Carbide India Limited pesticide plant in Bhopal, Madhya Pradesh, and spread over the neighbouring wards. Union Carbide Corporation, the parent company, was led by Warren Anderson. In February 1989 the company agreed to pay US$470 million in settlement. In June 2010 a Bhopal court convicted seven former employees, including Keshub Mahindra, the former chairman of Union Carbide India Limited, of causing death by negligence. Warren Anderson died in 2014.",
  },
  {
    id: "doc-mehta-summary", caseId: H, type: "financial_record", fileName: "CASE_SUMMARY_1992_SECURITIES_SCAM.txt",
    uploadedAt: "2026-09-21T09:10:00+05:30", extractionStatus: "completed", sizeKb: 2,
    sourceName: "Forbes India", sourceUrl: "https://www.forbesindia.com/article/independence-day-special/economic-milestone-stock-market-scam-(1992)/38457/1",
    extractedText:
      "Harshad Mehta, a stockbroker in Mumbai, obtained money from banks by using fake bank receipts. The State Bank of India supplied securities against forged cheques, and Bank of Karad and Metropolitan Co-operative Bank issued receipts that were not backed by government securities. Mehta used the money to raise the share price of ACC from about Rs 200 to Rs 9,000 on the Bombay Stock Exchange. The scam came to light in April 1992 and the market crashed. Mehta was arrested by the CBI on 9 November 1992, convicted in September 1999 and died in custody on 31 December 2001.",
  },
  {
    id: "doc-satyam-summary", caseId: S, type: "criminal_history", fileName: "COURT_SUMMARY_SATYAM_SCANDAL.txt",
    uploadedAt: "2026-09-21T09:15:00+05:30", extractionStatus: "completed", sizeKb: 2,
    sourceName: "The Quint", sourceUrl: "https://www.thequint.com/news/india/satyam-rajus-letter-of-confession",
    extractedText:
      "On 7 January 2009 B. Ramalinga Raju, chairman of Satyam Computer Services in Hyderabad, resigned and confessed that he had manipulated the accounts by about Rs 7,000 crore. The chief financial officer Vadlamani Srinivas was arrested three days later. The auditor Price Waterhouse was barred by SEBI in 2018. Tech Mahindra bought a 31% stake in Satyam in April 2009. In April 2015 a special court convicted Raju and nine others and sentenced them to seven years.",
  },
  {
    id: "doc-2g-summary", caseId: G, type: "criminal_history", fileName: "COURT_SUMMARY_2G_SPECTRUM_CASE.txt",
    uploadedAt: "2026-09-21T09:20:00+05:30", extractionStatus: "completed", sizeKb: 2,
    sourceName: "Business Today", sourceUrl: "https://www.businesstoday.in/industry/telecom/story/2g-scam-verdict-a-raja-kanimozhi-cag-vinod-rai-spectrum-87503-2017-12-21",
    extractedText:
      "The CBI alleged that A. Raja, then telecom minister, moved the cut-off date for 2G licence applications to favour Swan Telecom and Unitech Wireless. Swan Telecom sold a 45% stake to Etisalat and Unitech Wireless sold 60% to Telenor. The CBI also alleged that Shahid Balwa routed about Rs 200 crore to Kalaignar TV, in which Kanimozhi held a stake. On 21 December 2017 a special CBI court in New Delhi acquitted all the accused, including Raja, Kanimozhi and Siddharth Behura. The Delhi High Court admitted the CBI's appeal in March 2024.",
  },
  {
    id: "doc-pnb-complaint", caseId: P, type: "fir", fileName: "COMPLAINT_SUMMARY_PNB_29JAN2018.txt",
    uploadedAt: "2026-09-21T09:25:00+05:30", extractionStatus: "completed", sizeKb: 2,
    sourceName: "Wikipedia", sourceUrl: "https://en.wikipedia.org/wiki/Punjab_National_Bank_Scam",
    extractedText:
      "On 29 January 2018 Punjab National Bank filed a complaint with the CBI against Nirav Modi, Ami Modi, Nishal Modi and Mehul Choksi, partners of Diamonds R US, Solar Exports and Stellar Diamonds. The complaint said that Gokulnath Shetty, a retired deputy manager at the Fort branch in Mumbai, issued fraudulent letters of undertaking worth Rs 14,357 crore to overseas banks through SWIFT. Nirav Modi was arrested in London on 19 March 2019 and was declared a fugitive economic offender in December 2019. Usha Ananthasubramanian, the former chief executive of Punjab National Bank, was granted bail in August 2018.",
  },
  {
    id: "doc-nsel-summary", caseId: N, type: "financial_record", fileName: "CASE_SUMMARY_NSEL_DEFAULT.txt",
    uploadedAt: "2026-09-21T09:30:00+05:30", extractionStatus: "completed", sizeKb: 2,
    sourceName: "Business Standard", sourceUrl: "https://www.business-standard.com/article/companies/the-rise-and-fall-of-jignesh-shah-116071300360_1.html",
    extractedText:
      "The National Spot Exchange Limited suspended trading on 31 July 2013 and could not pay investors about Rs 5,600 crore. Jignesh Shah, the promoter of Financial Technologies, which owned NSEL, was arrested by the Economic Offences Wing on 7 May 2014. Anjani Sinha, the former chief executive, and Amit Mukherjee, a former vice president, were arrested in October 2013. Nilesh Patel, the managing director of NK Proteins, the biggest borrower, was arrested on 22 October 2013. Arunkumar Sharma of Lotus Refineries was named in the first charge sheet.",
  },
  {
    id: "doc-saradha-summary", caseId: R, type: "intelligence_report", fileName: "CASE_SUMMARY_SARADHA_GROUP.txt",
    uploadedAt: "2026-09-21T09:35:00+05:30", extractionStatus: "completed", sizeKb: 2,
    sourceName: "TradeBrains", sourceUrl: "https://tradebrains.in/saradha-scam-explained/",
    extractedText:
      "The Saradha Group, based in Kolkata, collected deposits from small investors by promising high returns. Its chairman Sudipta Sen wrote to the CBI on 6 April 2013 and absconded. He was arrested together with Debjani Mukherjee, an executive director of the group. Kunal Ghosh was the chief executive of the group's media business. The group bought Global Automobiles in 2011 as a front company. The Supreme Court transferred the investigation to the CBI in May 2014.",
  },
  {
    id: "doc-kingfisher-summary", caseId: K, type: "financial_record", fileName: "CASE_SUMMARY_KINGFISHER_MALLYA.txt",
    uploadedAt: "2026-09-21T09:40:00+05:30", extractionStatus: "completed", sizeKb: 2,
    sourceName: "Al Jazeera", sourceUrl: "https://www.aljazeera.com/economy/2018/12/10/indian-businessman-mallya-in-uk-court-for-extradition-case",
    extractedText:
      "Vijay Mallya, the chairman of the United Breweries Group, founded Kingfisher Airlines, which closed on 20 October 2012 owing more than Rs 9,000 crore to a consortium of banks led by the State Bank of India. Punjab National Bank is also owed money. Mallya left India on 2 March 2016 and was arrested in London on 18 April 2017. The Enforcement Directorate attached his assets. Kingfisher House in Vile Parle, Mumbai, was the head office of the airline.",
  },
  {
    id: "doc-agusta-summary", caseId: A, type: "criminal_history", fileName: "COURT_SUMMARY_AGUSTAWESTLAND.txt",
    uploadedAt: "2026-09-21T09:45:00+05:30", extractionStatus: "completed", sizeKb: 2,
    sourceName: "ThePrint", sourceUrl: "https://theprint.in/judiciary/agustawestland-vvip-chopper-scam-case-court-dismisses-christian-michels-extradition-papers-pleas/2790070/",
    extractedText:
      "India signed a contract for twelve AW101 helicopters with AgustaWestland in February 2010. After Giuseppe Orsi, the chief executive of Finmeccanica, was arrested in Italy in February 2013, the CBI registered an FIR naming S. P. Tyagi, the former air force chief, IDS Infotech and Aeromatrix. Christian Michel was extradited from Dubai in December 2018, and Rajeev Saxena and Deepak Talwar in January 2019. Gautam Khaitan and Sanjeev Tyagi were arrested on 9 December 2016. Orsi was fully acquitted by an Italian court in May 2019.",
  },
];
