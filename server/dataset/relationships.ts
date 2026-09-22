import type { Relationship, RelationshipType } from "../../src/types/index.ts";

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

let seq = 1;

/** type, from, to, strength (1-10), what the source says, case, confidence (0-100), dates. */
function rel(
  type: RelationshipType,
  sourceId: string,
  targetId: string,
  strength: number,
  note: string,
  caseId: string,
  confidence: number,
  start: string,
  end: string = start,
  source = "Public records and press reports (see the case sources)",
): Relationship {
  return {
    id: `r${String(seq++).padStart(3, "0")}`,
    type,
    sourceId,
    targetId,
    strength,
    frequency: 1,
    startDate: start,
    endDate: end,
    evidenceSource: source,
    caseId,
    confidence,
    note,
  };
}

export const relationships: Relationship[] = [
  // ---- 2008 Mumbai attacks
  rel("association", "let", "kasab", 9, "Kasab confessed that the ten attackers were Lashkar-e-Taiba members controlled from Pakistan.", M, 97, "2008-11-26"),
  rel("association", "let", "lakhvi", 9, "Described as the foremost suspected ringleader of the attacks.", M, 90, "2008-11-26"),
  rel("association", "let", "saeed", 8, "Founder of Lashkar-e-Taiba; convicted of terror financing in Pakistan in 2021–22.", M, 90, "2008-11-26"),
  rel("association", "let", "mir", 8, "Named as one of the masterminds; convicted in Pakistan in 2022.", M, 88, "2008-11-26"),
  rel("association", "lakhvi", "mir", 6, "Both named among the masterminds of the attacks.", M, 80, "2008-11-26"),
  rel("association", "headley", "rana", 8, "Rana was Headley's partner; both were later prosecuted (Headley in the US, Rana extradited to India in 2025).", M, 92, "2009-10-01"),
  rel("association", "headley", "let", 7, "Headley's interrogation pointed to support for Lashkar-e-Taiba in planning the attacks.", M, 85, "2008-01-01", "2008-11-26"),
  rel("association", "ansari", "let", 7, "An Indian national radicalised by Lashkar-e-Taiba; captured in July 2012.", M, 85, "2008-01-01", "2012-07-01"),
  rel("co_location", "kasab", "karachi", 6, "The attackers left Karachi on a cargo vessel before hijacking an Indian trawler.", M, 90, "2008-11-21"),
  rel("association", "let", "trawler", 5, "The attackers hijacked an Indian fishing trawler on the way to Mumbai.", M, 92, "2008-11-22"),
  rel("co_location", "let", "cst", 7, "Mass shooting at Chhatrapati Shivaji Terminus, 26 Nov 2008.", M, 97, "2008-11-26"),
  rel("co_location", "let", "taj", 7, "Attack on the Taj Mahal Palace Hotel; cleared on 29 Nov 2008 (Operation Black Tornado).", M, 97, "2008-11-26", "2008-11-29"),
  rel("co_location", "let", "trident", 7, "Attack on the Oberoi Trident Hotel, 26–28 Nov 2008.", M, 97, "2008-11-26", "2008-11-28"),
  rel("co_location", "let", "leopold", 6, "Mass shooting at Leopold Cafe, 26 Nov 2008.", M, 97, "2008-11-26"),
  rel("co_location", "let", "nariman", 7, "Attack on Nariman House, 26–28 Nov 2008.", M, 97, "2008-11-26", "2008-11-28"),
  rel("co_location", "let", "cama", 6, "Attack on Cama Hospital, 26 Nov 2008.", M, 97, "2008-11-26"),

  // ---- Bhopal
  rel("business", "ucc", "ucil", 9, "Union Carbide Corporation was the parent company of Union Carbide India Limited.", B, 97, "1984-12-03"),
  rel("business", "anderson", "ucc", 9, "Warren Anderson was chairman and CEO of Union Carbide Corporation.", B, 97, "1984-12-03"),
  rel("business", "kmahindra", "ucil", 9, "Keshub Mahindra was chairman of Union Carbide India Limited.", B, 97, "1984-12-03"),
  rel("co_location", "ucil", "bhopal-plant", 8, "UCIL operated the pesticide plant where the gas leaked.", B, 97, "1984-12-02", "1984-12-03"),
  rel("co_location", "bhopal-plant", "bhopal-city", 6, "The gas drifted over 36 wards with about 520,000 residents.", B, 95, "1984-12-03"),

  // ---- 1992 securities scam
  rel("financial_transaction", "hmehta", "sbi", 8, "Securities were obtained from the State Bank of India against forged cheques and receipts signed by corrupt officials.", H, 88, "1991-01-01", "1992-04-23"),
  rel("financial_transaction", "hmehta", "bok", 7, "Bank of Karad issued bank receipts used to obtain funds (as reported).", H, 80, "1991-01-01", "1992-04-23"),
  rel("financial_transaction", "hmehta", "mcb", 7, "Metropolitan Co-operative Bank issued bank receipts used to obtain funds (as reported).", H, 80, "1991-01-01", "1992-04-23"),
  rel("association", "hmehta", "acc", 6, "Drove ACC's share price from about ₹200 to about ₹9,000 in three months.", H, 90, "1991-12-01", "1992-04-23"),
  rel("co_location", "hmehta", "bse", 5, "The manipulation played out on the Bombay Stock Exchange.", H, 90, "1991-01-01", "1992-04-23"),

  // ---- Satyam
  rel("business", "raju", "satyam", 9, "Founder and chairman of Satyam Computer Services.", S, 97, "1987-01-01", "2009-01-07"),
  rel("business", "srinivas", "satyam", 8, "Chief financial officer of Satyam Computer Services.", S, 95, "2001-01-01", "2009-01-10"),
  rel("association", "raju", "srinivas", 8, "The CFO was arrested days after Raju's confession; both were among the accused.", S, 90, "2009-01-07", "2009-01-10"),
  rel("business", "pw", "satyam", 7, "Price Waterhouse audited Satyam's accounts; SEBI barred it in 2018.", S, 95, "2000-01-01", "2009-01-14"),
  rel("financial_transaction", "techm", "satyam", 6, "Tech Mahindra bought a 31% stake in Satyam on 13 April 2009.", S, 95, "2009-04-13"),
  rel("co_location", "satyam", "hyderabad-satyam", 6, "Satyam was headquartered in Hyderabad.", S, 95, "1987-01-01", "2009-01-07"),

  // ---- 2G
  rel("association", "raja", "swan", 6, "The CBI alleged the cut-off date was changed to favour Swan Telecom; all accused were acquitted in 2017.", G, 70, "2007-09-25", "2008-01-10"),
  rel("association", "raja", "unitech-wireless", 6, "The CBI alleged the cut-off date was changed to favour Unitech Wireless; all accused were acquitted in 2017.", G, 70, "2007-09-25", "2008-01-10"),
  rel("association", "raja", "kanimozhi", 6, "The CBI alleged a conspiracy; both were acquitted on 21 Dec 2017.", G, 65, "2008-01-01", "2011-05-20"),
  rel("association", "behura", "raja", 5, "Telecom secretary and minister in the licensing process; both acquitted.", G, 75, "2007-09-01", "2008-01-10"),
  rel("business", "kanimozhi", "kalaignar", 7, "The CBI said she held 20% of Kalaignar TV.", G, 75, "2007-01-01", "2011-05-20"),
  rel("financial_transaction", "balwa", "kalaignar", 7, "The CBI alleged about ₹200 crore was routed to Kalaignar TV; all accused were acquitted.", G, 60, "2008-01-01", "2011-02-08"),
  rel("financial_transaction", "swan", "etisalat", 7, "Swan Telecom sold 45% to Etisalat for about ₹4,200 crore.", G, 95, "2008-01-01"),
  rel("financial_transaction", "unitech-wireless", "telenor", 7, "Unitech Wireless sold 60% to Telenor for about ₹6,200 crore.", G, 95, "2008-01-01"),

  // ---- Nirav Modi / PNB
  rel("business", "nirav", "firestar", 9, "Founded Firestar in 1999.", P, 97, "1999-01-01"),
  rel("family", "nirav", "choksi", 8, "Mehul Choksi is Nirav Modi's maternal uncle.", P, 97, "1990-01-01"),
  rel("family", "nirav", "ami", 8, "Ami Modi is his wife.", P, 97, "1990-01-01"),
  rel("family", "nirav", "nishal", 8, "Nishal Modi is his brother.", P, 97, "1990-01-01"),
  rel("family", "nirav", "nehal", 8, "Nehal Modi is his stepbrother.", P, 95, "1990-01-01"),
  rel("association", "nirav", "parab", 7, "Subhash Parab is described as a close associate; declared wanted in the charge sheet.", P, 85, "2018-01-01"),
  rel("business", "nirav", "diamonds-r-us", 8, "Named by PNB as a partner in the firm.", P, 90, "2017-01-01", "2018-01-29"),
  rel("business", "nirav", "solar-exports", 8, "Named by PNB as a partner in the firm.", P, 90, "2017-01-01", "2018-01-29"),
  rel("business", "nirav", "stellar-diamonds", 8, "Named by PNB as a partner in the firm.", P, 90, "2017-01-01", "2018-01-29"),
  rel("business", "choksi", "gitanjali", 9, "Head of the Gitanjali Group.", P, 97, "1985-01-01"),
  rel("business", "shetty", "pnb", 8, "Retired deputy manager at PNB's Fort branch.", P, 95, "2010-01-01", "2018-01-29"),
  rel("business", "usha", "pnb", 7, "Managing director and CEO of PNB from August 2015 to May 2017.", P, 95, "2015-08-01", "2017-05-01"),
  rel("association", "shetty", "pnb-lou", 8, "Accused of issuing the fraudulent letters.", P, 88, "2017-01-01", "2018-01-29"),
  rel("financial_transaction", "pnb-lou", "diamonds-r-us", 8, "Letters issued on behalf of the firm to Hong Kong-based creditors.", P, 92, "2017-01-01", "2018-01-29"),
  rel("financial_transaction", "pnb-lou", "solar-exports", 8, "Letters issued on behalf of the firm to Hong Kong-based creditors.", P, 92, "2017-01-01", "2018-01-29"),
  rel("financial_transaction", "pnb-lou", "stellar-diamonds", 8, "Letters issued on behalf of the firm to Hong Kong-based creditors.", P, 92, "2017-01-01", "2018-01-29"),
  rel("financial_transaction", "pnb-lou", "pnb", 8, "The letters made PNB liable for about ₹14,357 crore.", P, 95, "2018-01-29"),
  rel("co_location", "pnb-lou", "pnb-fort", 7, "Issued at PNB's Fort branch in Mumbai.", P, 95, "2017-01-01", "2018-01-29"),
  rel("co_location", "nirav", "london", 7, "Arrested in central London on 19 March 2019; extradition hearings followed.", P, 97, "2019-03-19"),

  // ---- NSEL
  rel("business", "jshah", "ftil", 9, "Founder of Financial Technologies (now 63 Moons Technologies).", N, 95, "1988-01-01"),
  rel("business", "ftil", "nsel", 9, "63 Moons owned 99.99% of NSEL.", N, 95, "2005-05-18"),
  rel("business", "asinha", "nsel", 9, "Former chief executive and managing director of NSEL.", N, 97, "2008-01-01", "2013-07-31"),
  rel("business", "amukherjee", "nsel", 7, "Former VP (business development) at NSEL.", N, 97, "2008-01-01", "2013-07-31"),
  rel("business", "jbahukhandi", "nsel", 7, "Former assistant VP at NSEL.", N, 97, "2008-01-01", "2013-07-31"),
  rel("association", "amukherjee", "asinha", 5, "Named together in the first EOW charge sheet (6 Jan 2014).", N, 90, "2013-10-09", "2014-01-06"),
  rel("association", "asinha", "jshah", 6, "NSEL's chief executive and its promoter; both charge-sheeted.", N, 75, "2008-01-01", "2013-07-31"),
  rel("business", "npatel", "nkproteins", 9, "Managing director of NK Proteins.", N, 97, "2008-01-01"),
  rel("business", "asharma", "lotus", 9, "Promoter and director of Lotus Refineries.", N, 97, "2008-01-01"),
  rel("business", "sgupta", "pdagro", 9, "Promoter of PD Agroprocessors.", N, 92, "2008-01-01"),
  rel("business", "rmehta", "swastik", 9, "Of Swastik Overseas, Ahmedabad.", N, 92, "2008-01-01"),
  rel("financial_transaction", "nkproteins", "nsel", 8, "The biggest borrower from NSEL.", N, 92, "2012-01-01", "2013-07-31"),
  rel("financial_transaction", "lotus", "nsel", 7, "One of the defaulting borrowers.", N, 90, "2012-01-01", "2013-07-31"),
  rel("financial_transaction", "pdagro", "nsel", 7, "One of the defaulting borrowers.", N, 90, "2012-01-01", "2013-07-31"),
  rel("financial_transaction", "swastik", "nsel", 7, "One of the defaulting borrowers.", N, 90, "2012-01-01", "2013-07-31"),

  // ---- Saradha
  rel("business", "ssen", "saradha", 9, "Chairman and managing director of the Saradha Group.", R, 97, "2006-01-01", "2013-04-06"),
  rel("business", "dmukherjee", "saradha", 8, "Executive director with cheque-signing authority.", R, 95, "2010-01-01", "2013-04-06"),
  rel("association", "ssen", "dmukherjee", 8, "Arrested together in April 2013.", R, 92, "2013-04-01"),
  rel("business", "kghosh", "saradha", 7, "CEO of the group's media businesses (as reported).", R, 85, "2012-01-01", "2013-04-06"),
  rel("business", "globalauto", "saradha", 7, "Bought in 2011 as a front for the scheme.", R, 92, "2011-01-01"),
  rel("co_location", "saradha", "kolkata", 6, "Based in Kolkata; most depositors were in eastern India.", R, 95, "2006-01-01", "2013-04-06"),

  // ---- Kingfisher / Mallya
  rel("business", "mallya", "kfa", 9, "Founded Kingfisher Airlines.", K, 97, "2003-01-01", "2012-10-20"),
  rel("business", "mallya", "ubg", 9, "Chairman of the United Breweries Group.", K, 97, "1983-01-01"),
  rel("business", "ubg", "kfa", 8, "The airline was owned by the United Breweries Group.", K, 95, "2003-01-01", "2012-10-20"),
  rel("financial_transaction", "kfa", "sbi", 9, "A consortium of Indian banks led by the State Bank of India is owed more than ₹9,000 crore.", K, 95, "2005-01-01", "2016-03-02"),
  rel("financial_transaction", "kfa", "pnb", 6, "Punjab National Bank is on the list of banks owed money by Mallya.", K, 90, "2005-01-01", "2016-03-02"),
  rel("co_location", "kfa", "kingfisher-house", 6, "Head office was Kingfisher House in Vile Parle, Mumbai.", K, 95, "2005-05-09", "2012-10-20"),
  rel("co_location", "mallya", "london", 7, "Arrested in the UK on 18 April 2017; extradition proceedings followed.", K, 95, "2017-04-18"),

  // ---- AgustaWestland
  rel("family", "sptyagi", "sanjeevtyagi", 8, "Sanjeev Tyagi is his cousin.", A, 95, "2016-12-09"),
  rel("association", "sptyagi", "khaitan", 6, "Arrested together on 9 December 2016.", A, 88, "2016-12-09"),
  rel("association", "sanjeevtyagi", "khaitan", 5, "Arrested together on 9 December 2016.", A, 88, "2016-12-09"),
  rel("business", "michel", "agustawestland", 8, "Accused of acting as the company's middleman; he denies it.", A, 75, "2006-01-01", "2010-02-01"),
  rel("association", "michel", "saxena", 6, "Co-accused in the CBI case; Saxena was extradited from Dubai in January 2019.", A, 85, "2018-12-01", "2019-01-31"),
  rel("association", "michel", "talwar", 6, "Co-accused in the money-laundering probe; Talwar was extradited in January 2019.", A, 85, "2018-12-01", "2019-01-31"),
  rel("association", "saxena", "talwar", 5, "Extradited from Dubai together on 31 January 2019.", A, 92, "2019-01-31"),
  rel("association", "haschke", "agustawestland", 5, "Accused of being a middleman; fully acquitted in June 2025.", A, 70, "2006-01-01", "2010-02-01"),
  rel("business", "agustawestland", "finmeccanica", 9, "Finmeccanica was AgustaWestland's parent company.", A, 97, "2000-01-01"),
  rel("business", "orsi", "finmeccanica", 9, "Chief executive of Finmeccanica when arrested in February 2013.", A, 97, "2011-01-01", "2013-02-12"),
  rel("vehicle_ownership", "agustawestland", "aw101", 8, "Supplier of the twelve AW101 VVIP helicopters ordered in February 2010.", A, 95, "2010-02-01", "2014-01-01"),
  rel("financial_transaction", "sptyagi", "agustawestland", 5, "The CBI alleges specifications were tweaked and bribes paid; he is presumed innocent.", A, 55, "2006-01-01", "2010-02-01"),
  rel("association", "idsinfotech", "agustawestland", 4, "Named in the CBI's FIR alongside the manufacturer.", A, 60, "2013-03-13"),
  rel("association", "aeromatrix", "agustawestland", 4, "Named in the CBI's FIR alongside the manufacturer.", A, 60, "2013-03-13"),
];
