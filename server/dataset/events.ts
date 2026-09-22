import type { EventType, TimelineEvent } from "../../src/types/index.ts";

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
function ev(caseId: string, type: EventType, date: string, title: string, description: string, entityIds: string[], locationName?: string): TimelineEvent {
  return {
    id: `ev${String(seq++).padStart(3, "0")}`,
    caseId,
    entityIds,
    type,
    title,
    description,
    timestamp: `${date}T00:00:00+05:30`,
    locationName,
  };
}

// "filing" = complaints, charge sheets, court orders and verdicts; "sighting" = the incident itself.
export const events: TimelineEvent[] = [
  // ---- 2008 Mumbai attacks
  ev(M, "sighting", "2008-11-26", "Attacks begin", "Ten Lashkar-e-Taiba gunmen reach Mumbai by sea and attack Chhatrapati Shivaji Terminus, the Taj and Trident hotels, Leopold Cafe, Nariman House and Cama Hospital.", ["let", "cst", "taj", "trident", "leopold", "nariman", "cama"], "South Mumbai"),
  ev(M, "sighting", "2008-11-29", "Attacks end", "National Security Guards complete Operation Black Tornado at the Taj; the last attackers are killed. 175 people died, including nine attackers.", ["taj"], "Taj Mahal Palace Hotel"),
  ev(M, "filing", "2010-05-06", "Kasab sentenced to death", "Found guilty on 80 of 86 charges; five death sentences.", ["kasab"]),
  ev(M, "filing", "2012-11-21", "Kasab executed", "Hanged at Yerwada Central Jail.", ["kasab"]),
  ev(M, "filing", "2013-01-23", "Headley sentenced in the US", "Sentenced to 35 years after pleading guilty to 12 counts, including conspiracy to commit murder in India.", ["headley"]),
  ev(M, "filing", "2015-04-09", "Lakhvi bailed in Pakistan", "Released on bail and then disappeared.", ["lakhvi"]),
  ev(M, "arrest", "2021-01-02", "Lakhvi arrested again", "Arrested in Lahore; later convicted of terror financing.", ["lakhvi"]),
  ev(M, "arrest", "2025-04-10", "Tahawwur Rana arrives in Delhi", "Extradited from the US after his last plea was rejected; taken into NIA custody.", ["rana"]),

  // ---- Bhopal
  ev(B, "sighting", "1984-12-03", "Gas leak", "Methyl isocyanate escapes from the Union Carbide plant on the night of 2–3 December. The official immediate death toll is 2,259.", ["ucil", "bhopal-plant", "bhopal-city"], "Bhopal"),
  ev(B, "transaction", "1989-02-01", "US$470 million settlement", "After the Supreme Court urged both sides to settle, Union Carbide agrees to pay US$470 million; the sum is paid immediately.", ["ucc"]),
  ev(B, "filing", "2010-06-07", "Seven former UCIL staff convicted", "Including chairman Keshub Mahindra: causing death by negligence, two years and a small fine; released on bail.", ["kmahindra", "ucil"]),
  ev(B, "filing", "2014-09-29", "Warren Anderson dies", "Aged 92; he never stood trial in India.", ["anderson"]),

  // ---- 1992 securities scam
  ev(H, "filing", "1992-04-01", "Scam comes to light (late April 1992)", "It becomes clear that Mehta is a disproportionately large investor; a selling frenzy follows and the market crashes.", ["hmehta", "bse"]),
  ev(H, "arrest", "1992-11-09", "Mehta and his brothers arrested", "Arrested by the CBI over misappropriation of more than 2.8 million shares of about 90 companies.", ["hmehta"]),
  ev(H, "filing", "1999-09-01", "Bombay High Court convicts Mehta", "Five years of rigorous imprisonment.", ["hmehta"]),
  ev(H, "sighting", "2001-12-31", "Mehta dies in custody", "Taken ill in Thane prison; died aged 47 with several cases pending.", ["hmehta"]),
  ev(H, "filing", "2003-01-14", "Supreme Court upholds conviction", "By a 2–1 majority; one judge would have acquitted.", ["hmehta"]),

  // ---- Satyam
  ev(S, "filing", "2009-01-07", "Raju confesses and resigns", "Says he manipulated Satyam's accounts by about ₹7,000 crore.", ["raju", "satyam"]),
  ev(S, "arrest", "2009-01-10", "CFO picked up by the CID", "Vadlamani Srinivas is questioned and then arrested.", ["srinivas"]),
  ev(S, "transaction", "2009-04-13", "Tech Mahindra wins the auction", "Buys a 31% stake in Satyam.", ["techm", "satyam"]),
  ev(S, "filing", "2010-02-01", "CBI takes over the case", "Files partial charge sheets that are later merged into one.", ["raju", "satyam"]),
  ev(S, "filing", "2015-04-09", "Raju and nine others found guilty", "Seven years' imprisonment for falsifying accounts and related offences.", ["raju"]),
  ev(S, "filing", "2018-01-01", "SEBI bars Price Waterhouse", "Barred from auditing listed companies for two years and ordered to give up over ₹13 crore.", ["pw"]),

  // ---- 2G
  ev(G, "filing", "2008-01-10", "Licences issued", "122 licences are issued at 2001 prices after the cut-off date was moved to 25 September 2007.", ["raja", "swan", "unitech-wireless"]),
  ev(G, "arrest", "2011-02-02", "A. Raja arrested", "Arrested by the CBI; bail on 15 May 2012.", ["raja"]),
  ev(G, "arrest", "2011-05-20", "Kanimozhi arrested", "Arrested by the CBI; bail on 28 November 2011 after 188 days.", ["kanimozhi"]),
  ev(G, "filing", "2017-12-21", "All accused acquitted", "The special CBI court says the prosecution failed to prove any charge.", ["raja", "kanimozhi", "balwa", "behura"]),
  ev(G, "filing", "2018-03-20", "ED and CBI appeal", "Appeals filed in the Delhi High Court on 19 and 20 March 2018.", ["raja"]),
  ev(G, "filing", "2024-03-22", "Delhi High Court admits the CBI's appeal", "The court says the trial court's judgment needs deeper examination.", ["raja", "kanimozhi"]),

  // ---- PNB
  ev(P, "filing", "2018-01-29", "PNB complains to the CBI", "Alleges that Nirav Modi, Ami Modi, Nishal Modi and Mehul Choksi colluded with two bank officials.", ["pnb", "nirav", "choksi", "ami", "nishal"]),
  ev(P, "filing", "2018-05-18", "Fraud reported to have grown to ₹14,357 crore", "The scale of the fraudulent letters is reported at about US$2 billion.", ["pnb-lou"]),
  ev(P, "arrest", "2019-03-19", "Nirav Modi arrested in London", "A bank clerk recognised him and alerted police; he is refused bail repeatedly.", ["nirav", "london"], "London"),
  ev(P, "filing", "2019-12-01", "Declared a fugitive economic offender", "The first PNB accused to be declared under the new law.", ["nirav"]),
  ev(P, "filing", "2021-02-25", "UK court approves extradition", "The Home Secretary signs the order in April 2021.", ["nirav"]),
  ev(P, "filing", "2022-12-01", "Final appeal refused", "The Royal Courts of Justice refuses permission to appeal to the UK Supreme Court.", ["nirav"]),

  // ---- NSEL
  ev(N, "filing", "2013-07-31", "Trading suspended", "NSEL cannot pay investors; about ₹5,600 crore is owed by 24 borrowers.", ["nsel", "ftil"]),
  ev(N, "arrest", "2013-10-09", "First arrest", "Amit Mukherjee is arrested by the Mumbai EOW; Anjani Sinha follows on 17 October.", ["amukherjee", "asinha"]),
  ev(N, "filing", "2014-01-06", "First charge sheet", "Names five accused, including Sinha, Mukherjee, Bahukhandi, Nilesh Patel and Arunkumar Sharma.", ["asinha", "amukherjee", "jbahukhandi", "npatel", "asharma"]),
  ev(N, "arrest", "2014-05-07", "Jignesh Shah arrested by the EOW", "Bail granted by the Bombay High Court on 22 August 2014.", ["jshah"]),
  ev(N, "arrest", "2016-07-13", "Shah arrested by the ED", "Arrested under PMLA; he says he is a victim of management fraud.", ["jshah"]),
  ev(N, "filing", "2018-12-27", "Supplementary charge sheet", "The EOW names 63 entities, including top brokers, for the first time.", ["nsel"]),
  ev(N, "filing", "2019-09-17", "Tribunal quashes ED attachment", "Over ₹1,000 crore of assets of 63 Moons Technologies ordered to be released.", ["ftil"]),

  // ---- Saradha
  ev(R, "filing", "2009-01-01", "SEBI first confronts the group", "The group responds by opening up to 200 companies with cross-holdings.", ["saradha"]),
  ev(R, "filing", "2011-01-01", "SEBI warns West Bengal", "About the group's chit-fund activities.", ["saradha"]),
  ev(R, "filing", "2013-04-06", "Sudipta Sen writes to the CBI and absconds", "An 18-page letter; the group collapses in April 2013.", ["ssen", "saradha"]),
  ev(R, "arrest", "2013-04-20", "Sen and Debjani Mukherjee arrested (April 2013)", "Arrested together.", ["ssen", "dmukherjee"]),
  ev(R, "filing", "2014-05-01", "Supreme Court hands the probe to the CBI", "Citing inter-state ramifications, possible international money laundering and regulatory failures.", ["saradha"]),

  // ---- Kingfisher / Mallya
  ev(K, "filing", "2012-10-20", "Kingfisher Airlines closes", "Debts to banks exceed US$1 billion.", ["kfa", "mallya"]),
  ev(K, "sighting", "2016-03-02", "Mallya leaves India", "His passport was revoked in April 2016 and he resigned from the Rajya Sabha on 2 May 2016.", ["mallya"]),
  ev(K, "filing", "2016-06-13", "Declared a proclaimed offender", "A PMLA court acts on the ED's request over an alleged ₹9,000 crore loan default.", ["mallya"]),
  ev(K, "arrest", "2017-04-18", "Arrested in the UK", "Released on bail pending the extradition case.", ["mallya", "london"], "London"),
  ev(K, "filing", "2018-12-01", "UK court says he can be extradited", "Mallya appeals.", ["mallya"]),
  ev(K, "filing", "2020-05-01", "Final appeal rejected", "The order has not been carried out because of a confidential legal matter.", ["mallya"]),
  ev(K, "filing", "2022-07-11", "Four months for contempt", "The Supreme Court punishes a US$40 million transfer to his children in breach of court orders.", ["mallya"]),

  // ---- AgustaWestland
  ev(A, "filing", "2010-02-01", "Contract signed", "India orders 12 AW101 helicopters.", ["agustawestland", "aw101"]),
  ev(A, "arrest", "2013-02-12", "Finmeccanica CEO arrested in Italy", "Giuseppe Orsi's arrest brings the deal to light; the defence minister orders a CBI probe the next day.", ["orsi", "finmeccanica"]),
  ev(A, "filing", "2013-03-13", "CBI registers an FIR", "Names 13 persons and four companies, including S. P. Tyagi and IDS Infotech.", ["sptyagi", "idsinfotech", "aeromatrix", "agustawestland"]),
  ev(A, "filing", "2014-01-01", "India cancels the contract", "For breach of the pre-contract Integrity Pact.", ["agustawestland", "aw101"]),
  ev(A, "arrest", "2016-12-09", "S. P. Tyagi, Sanjeev Tyagi and Gautam Khaitan arrested", "By the CBI; a charge sheet against S. P. Tyagi and nine others follows in September 2017.", ["sptyagi", "sanjeevtyagi", "khaitan"]),
  ev(A, "filing", "2018-01-08", "Milan appeals court acquits", "The third Court of Appeals of Milan acquits the defendants.", ["orsi"]),
  ev(A, "arrest", "2018-12-04", "Christian Michel extradited", "Brought from Dubai in early December 2018.", ["michel"]),
  ev(A, "arrest", "2019-01-31", "Rajeev Saxena and Deepak Talwar extradited", "Both from Dubai.", ["saxena", "talwar"]),
  ev(A, "filing", "2019-05-22", "Orsi fully acquitted", "By Italy's judiciary.", ["orsi"]),
  ev(A, "filing", "2025-02-01", "Michel granted bail", "By the Supreme Court after about six years in custody (February 2025).", ["michel"]),
  ev(A, "filing", "2025-06-30", "Guido Haschke fully acquitted", "By the Appeals Court of Brescia.", ["haschke"]),
];
