import type { CaseRecord } from "../../src/types/index.ts";
import { commons, link, wiki } from "./build.ts";

const REVIEWED = "2026-09-21T00:00:00+05:30";

const agency = (name: string, badge: string) => ({ name, badge, initials: badge.slice(0, 2).toUpperCase() });

export const cases: CaseRecord[] = [
  {
    id: "mumbai-2008",
    title: "2008 Mumbai Attacks (26/11)",
    category: "Terrorism / cross-border conspiracy",
    status: "under_review",
    priority: "critical",
    year: 2008,
    place: "Mumbai, Maharashtra",
    description:
      "Between 26 and 29 November 2008 ten members of Lashkar-e-Taiba carried out twelve coordinated attacks in South Mumbai, including the Chhatrapati Shivaji Terminus, the Taj Mahal Palace and Oberoi Trident hotels, Leopold Cafe, Nariman House and Cama Hospital. Nine attackers were killed; Ajmal Kasab was captured. Investigations traced the plot to handlers in Pakistan and to an American scout, David Headley.",
    impact: "175 people died (including nine attackers) and 300+ were injured; property damage estimated at US$18.5 million.",
    outcome:
      "Kasab was convicted in May 2010 and executed on 21 November 2012. Headley was sentenced to 35 years in the US (2013). Tahawwur Rana was extradited to India on 10 April 2025. Pakistan convicted several LeT leaders for terror financing in 2021–22.",
    entityIds: [],
    assignedInvestigators: [agency("Mumbai Police (Crime Branch)", "Mumbai Police"), agency("National Investigation Agency", "NIA")],
    createdAt: "2008-11-26T00:00:00+05:30",
    updatedAt: REVIEWED,
    sources: [
      link("Britannica", "Mumbai terrorist attacks of 2008", "https://www.britannica.com/event/Mumbai-terrorist-attacks-of-2008"),
      link("TIME", "Kasab's death sentence: will the Mumbai terrorist finally face justice?", "https://time.com/archive/7152902/ajmal-kasabs-death-sentence-will-the-mumbai-terrorist-finally-face-justice/"),
      wiki("2008 Mumbai attacks", "2008_Mumbai_attacks"),
    ],
    images: [
      commons("2008 Mumbai terror attacks Taj dome burned 2.jpg", "The Taj Mahal Palace Hotel dome after the attacks", "Nicholas (Nichalp)", "CC BY-SA 3.0"),
      commons("2008 Mumbai terror attacks Nariman House front view 3.jpg", "Nariman House, one of the attack sites", "Nicholas (Nichalp)", "CC BY-SA 3.0"),
      commons("Chhatrapati Shivaji Terminus (Victoria Terminus).jpg", "Chhatrapati Shivaji Terminus, Mumbai", "Joe Ravi", "CC BY-SA 3.0"),
    ],
  },
  {
    id: "bhopal-1984",
    title: "Bhopal Gas Disaster",
    category: "Industrial disaster / corporate negligence",
    status: "under_review",
    priority: "critical",
    year: 1984,
    place: "Bhopal, Madhya Pradesh",
    description:
      "On the night of 2–3 December 1984, methyl isocyanate gas leaked from the Union Carbide India Limited pesticide plant in Bhopal and drifted over the surrounding neighbourhoods. Investigations found substandard operating and safety procedures at an understaffed plant, with the safety systems not working.",
    impact: "Official immediate death toll 2,259; Madhya Pradesh confirmed 3,787 deaths; independent estimates run far higher. About 520,000 people lived in the gas-affected wards.",
    outcome:
      "Union Carbide paid US$470 million in a February 1989 settlement. In June 2010 seven former UCIL employees, including chairman Keshub Mahindra, were convicted of causing death by negligence (two years, bail). Warren Anderson, then UCC chairman, died in 2014 without facing trial in India.",
    entityIds: [],
    assignedInvestigators: [agency("Central Bureau of Investigation", "CBI")],
    createdAt: "1984-12-03T00:00:00+05:30",
    updatedAt: REVIEWED,
    sources: [
      link("Britannica", "Bhopal disaster: causes, effects, facts and history", "https://www.britannica.com/event/Bhopal-disaster"),
      link("Bhopal Medical Appeal", "What happened: the Bhopal gas disaster", "https://www.bhopal.org/continuing-disaster/the-bhopal-gas-disaster/union-carbides-disaster/"),
      link("UK Health and Safety Executive", "Union Carbide India Ltd, Bhopal, 3 December 1984", "https://www.hse.gov.uk/comah/sragtech/caseuncarbide84.htm"),
      wiki("Bhopal disaster", "Bhopal_disaster"),
    ],
    images: [commons("Union Carbide pesticide factory, Bhopal, India, 1985.jpg", "The Union Carbide pesticide factory, Bhopal, 1985", "Bhopal Medical Appeal, Martin Stott", "CC BY-SA 2.0")],
  },
  {
    id: "mehta-1992",
    title: "1992 Securities Scam (Harshad Mehta)",
    category: "Securities fraud / banking scam",
    status: "closed",
    priority: "critical",
    year: 1992,
    place: "Mumbai, Maharashtra",
    description:
      "Stockbroker Harshad Mehta used fake bank receipts and the ready-forward deal system to draw money out of banks and pour it into shares, sending prices of stocks such as ACC up several thousand per cent. When the scheme was exposed in April 1992 the market crashed and banks were left holding worthless receipts.",
    impact: "Around ₹4,000–5,000 crore was siphoned from the banking system; the Sensex fell from about 4,500 to 2,500.",
    outcome:
      "Mehta was charged with 72 criminal offences and faced 600+ civil suits. The Bombay High Court convicted him in September 1999 (five years) and the Supreme Court upheld this by 2–1 in January 2003. He died in custody in December 2001.",
    entityIds: [],
    assignedInvestigators: [agency("Central Bureau of Investigation", "CBI")],
    createdAt: "1992-04-01T00:00:00+05:30",
    updatedAt: REVIEWED,
    sources: [
      link("Forbes India", "Economic milestone: the stock market scam (1992)", "https://www.forbesindia.com/article/independence-day-special/economic-milestone-stock-market-scam-(1992)/38457/1"),
      wiki("1992 Indian stock market scam", "1992_Indian_stock_market_scam"),
      wiki("Harshad Mehta", "Harshad_Mehta"),
    ],
    images: [commons("BSE building at Dalal Street.JPG", "The Bombay Stock Exchange building, Dalal Street", "BSEINDIA", "CC BY-SA 3.0")],
  },
  {
    id: "satyam-2009",
    title: "Satyam Computer Services Scandal",
    category: "Corporate accounting fraud",
    status: "under_review",
    priority: "critical",
    year: 2009,
    place: "Hyderabad, Telangana",
    description:
      "On 7 January 2009 Satyam chairman B. Ramalinga Raju wrote that he had manipulated the company's accounts, inflating profits and showing cash and employees that did not exist. Much of the money was put into Hyderabad real estate; the fraud came apart when the property market collapsed.",
    impact: "Accounts overstated by roughly ₹7,000 crore; about 13,000 non-existent employees were allegedly on the payroll; shares fell from ₹544 to about ₹6.",
    outcome:
      "The CBI took over the case in 2010. In April 2015 a Hyderabad court found Raju and nine others guilty and sentenced them to seven years. In 2018 SEBI barred Price Waterhouse from auditing listed companies for two years. Later appeals should be checked in current records.",
    entityIds: [],
    assignedInvestigators: [agency("Andhra Pradesh CID", "APCID"), agency("Central Bureau of Investigation", "CBI")],
    createdAt: "2009-01-07T00:00:00+05:30",
    updatedAt: REVIEWED,
    sources: [
      link("The Quint", "Satyam Raju's 2009 letter of confession: written and retracted", "https://www.thequint.com/news/india/satyam-rajus-letter-of-confession"),
      wiki("Satyam scandal", "Satyam_scandal"),
    ],
    images: [commons("Satyam Tech Center.JPG", "Satyam's Tech Center in Hyderabad", "Ranjit Nair (assumed)", "CC BY-SA 3.0")],
  },
  {
    id: "2g-2008",
    title: "2G Spectrum Allocation Case",
    category: "Corruption / telecom licensing",
    status: "under_review",
    priority: "high",
    year: 2008,
    place: "New Delhi",
    description:
      "In January 2008 the Department of Telecommunications issued 122 2G licences on a first-come-first-served basis at 2001 prices, after the cut-off date was moved forward. The CAG estimated a huge notional loss, and the CBI alleged that firms such as Swan Telecom and Unitech Wireless were favoured in return for bribes.",
    impact: "CAG's notional loss estimate: ₹1.76 lakh crore. The CBI alleged about ₹200 crore reached Kalaignar TV.",
    outcome:
      "On 21 December 2017 a special CBI court acquitted all accused, including A. Raja and Kanimozhi, saying the prosecution had failed to prove any charge. The ED and CBI appealed; in March 2024 the Delhi High Court admitted the CBI's appeal. The Supreme Court had cancelled the licences in 2012.",
    entityIds: [],
    assignedInvestigators: [agency("Central Bureau of Investigation", "CBI"), agency("Enforcement Directorate", "ED")],
    createdAt: "2008-01-10T00:00:00+05:30",
    updatedAt: REVIEWED,
    sources: [
      link("Business Today", "2G scam verdict: all accused, including A Raja, acquitted", "https://www.businesstoday.in/industry/telecom/story/2g-scam-verdict-a-raja-kanimozhi-cag-vinod-rai-spectrum-87503-2017-12-21"),
      link("SCC Online", "2G case: Special CBI judge acquits all accused, money-laundering case too", "https://www.scconline.com/blog/post/2017/12/21/2g-spectrum-case-special-cbi-judge-acquits-accused-money-laundering-case/"),
      wiki("2G spectrum case", "2G_spectrum_case"),
    ],
    images: [commons("Sanchar Bhawan.jpg", "Sanchar Bhawan, New Delhi (Department of Telecommunications)", "Ramesh Lalwani", "CC BY 2.0")],
  },
  {
    id: "pnb-2018",
    title: "Nirav Modi / PNB Fraud",
    category: "Bank fraud / fugitive economic offender",
    status: "active",
    priority: "critical",
    year: 2018,
    place: "Mumbai, Maharashtra",
    description:
      "Punjab National Bank's Fort branch in Mumbai issued fraudulent Letters of Undertaking for firms linked to Nirav Modi and the Gitanjali Group, letting them raise money from overseas branches of other Indian banks. The bank complained to the CBI on 29 January 2018 after Modi and family members had left India.",
    impact: "About ₹14,357 crore (roughly US$2 billion) in fraudulent letters of undertaking.",
    outcome:
      "Nirav Modi was arrested in London in March 2019 and declared a fugitive economic offender in December 2019. UK courts approved his extradition (2021) and refused permission to appeal further in December 2022. Enforcement action has covered assets worth several hundred crore rupees.",
    entityIds: [],
    assignedInvestigators: [agency("Central Bureau of Investigation", "CBI"), agency("Enforcement Directorate", "ED")],
    createdAt: "2018-01-29T00:00:00+05:30",
    updatedAt: REVIEWED,
    sources: [
      link("Gulf News", "UK Home Secretary approves extradition of Nirav Modi to India", "https://gulfnews.com/world/asia/india/uk-home-secretary-approves-extradition-of-nirav-modi-to-india-1.78546876"),
      link("DD News", "UK court rejects Nirav Modi's bail plea again", "https://ddnews.gov.in/en/uk-court-rejects-nirav-modis-bail-plea-again-amid-cbi-push-for-extradition-in-pnb-fraud-case/"),
      wiki("Punjab National Bank scam", "Punjab_National_Bank_Scam"),
      wiki("Nirav Modi", "Nirav_Modi"),
    ],
    images: [commons("Punjab National Bank, Lucknow.jpg", "A Punjab National Bank branch (Lucknow; illustrative, not the Mumbai branch involved)", "Harshvardhansonkar", "CC BY-SA 3.0")],
  },
  {
    id: "nsel-2013",
    title: "NSEL Payment Default",
    category: "Commodity exchange fraud",
    status: "active",
    priority: "high",
    year: 2013,
    place: "Mumbai, Maharashtra",
    description:
      "The National Spot Exchange Ltd (NSEL), promoted by Financial Technologies (now 63 Moons Technologies), suspended trading on 31 July 2013 and could not pay investors. Investigators say borrowers pledged non-existent stock and fake warehouse receipts, and that brokers mis-sold the contracts as fixed-return products.",
    impact: "About ₹5,600 crore was owed to some 13,000 investors by 24 borrowers.",
    outcome:
      "Mumbai's Economic Offences Wing filed its first charge sheet in January 2014 and a supplementary one against 63 entities in December 2018. Jignesh Shah was arrested by the EOW (2014) and the ED (2016) and says he is a victim of management fraud; a tribunal quashed an ED attachment in 2019. Litigation continues.",
    entityIds: [],
    assignedInvestigators: [agency("Economic Offences Wing, Mumbai", "EOW"), agency("Enforcement Directorate", "ED"), agency("Central Bureau of Investigation", "CBI")],
    createdAt: "2013-07-31T00:00:00+05:30",
    updatedAt: REVIEWED,
    sources: [
      link("Business Standard", "The rise and fall of Jignesh Shah", "https://www.business-standard.com/article/companies/the-rise-and-fall-of-jignesh-shah-116071300360_1.html"),
      link("Business Standard", "I am a victim of management fraud at NSEL: Jignesh Shah", "https://www.business-standard.com/amp/article/companies/i-am-a-victim-of-management-fraud-at-nsel-jignesh-shah-113092501060_1.html"),
      wiki("NSEL case", "NSEL_case"),
    ],
    images: [],
  },
  {
    id: "saradha-2013",
    title: "Saradha Group Ponzi Scheme",
    category: "Ponzi scheme / chit fund fraud",
    status: "active",
    priority: "critical",
    year: 2013,
    place: "Kolkata, West Bengal",
    description:
      "The Saradha Group, a consortium of more than 200 companies, collected deposits from small investors in eastern India by promising high returns through collective investment schemes and chit funds. SEBI first confronted it in 2009 and warned the West Bengal government in 2011; the group collapsed in April 2013.",
    impact: "Deposits of roughly ₹20,000–30,000 crore were collected from about 1.7 million depositors (as reported).",
    outcome:
      "The Supreme Court transferred the probe to the CBI in May 2014. Group chairman Sudipta Sen and executive director Debjani Mukherjee were arrested; several politicians and officials were also arrested. Recovery and trials are continuing.",
    entityIds: [],
    assignedInvestigators: [agency("Central Bureau of Investigation", "CBI"), agency("Enforcement Directorate", "ED")],
    createdAt: "2013-04-06T00:00:00+05:30",
    updatedAt: REVIEWED,
    sources: [
      link("TradeBrains", "Saradha scam explained", "https://tradebrains.in/saradha-scam-explained/"),
      wiki("Saradha Group financial scandal", "Saradha_Group_financial_scandal"),
    ],
    images: [commons("Sudipto_Sen.jpg", "Sudipta Sen, chairman of the Saradha Group", "Oxfordx", "CC BY-SA 4.0")],
  },
  {
    id: "kingfisher-2016",
    title: "Kingfisher Airlines / Vijay Mallya",
    category: "Bank loan default / money laundering",
    status: "active",
    priority: "critical",
    year: 2016,
    place: "Mumbai / Bengaluru",
    description:
      "Kingfisher Airlines, founded by Vijay Mallya, shut down in October 2012 owing large sums to a consortium of Indian banks led by the State Bank of India. Mallya left India on 2 March 2016. Indian agencies allege loan money was diverted abroad; he says he has done nothing wrong and calls the case politically motivated.",
    impact: "More than ₹9,000 crore in unpaid bank loans; the ED attached assets worth about ₹9,661 crore by December 2016.",
    outcome:
      "A UK court approved Mallya's extradition in 2018 and his final appeal was rejected in 2020, but as of the latest sources the order had not been carried out. He was declared a fugitive economic offender in 2019 and sentenced to four months for contempt of court in July 2022.",
    entityIds: [],
    assignedInvestigators: [agency("Central Bureau of Investigation", "CBI"), agency("Enforcement Directorate", "ED")],
    createdAt: "2016-03-02T00:00:00+05:30",
    updatedAt: REVIEWED,
    sources: [
      link("Al Jazeera", "Indian businessman Mallya in UK court for extradition case", "https://www.aljazeera.com/economy/2018/12/10/indian-businessman-mallya-in-uk-court-for-extradition-case"),
      wiki("Vijay Mallya", "Vijay_Mallya"),
      wiki("Kingfisher Airlines", "Kingfisher_Airlines"),
    ],
    images: [
      commons("Vijaymallya.jpg", "Vijay Mallya at the World Economic Forum", "World Economic Forum / Dana Smillie", "CC BY-SA 2.0"),
      commons("Kingfisher Airlines Airbus A320-200.jpg", "A Kingfisher Airlines Airbus A320", "marirs", "CC BY-SA 2.0"),
    ],
  },
  {
    id: "agusta-2013",
    title: "AgustaWestland VVIP Helicopter Case",
    category: "Defence procurement / bribery",
    status: "active",
    priority: "high",
    year: 2013,
    place: "New Delhi / Milan",
    description:
      "In 2010 India signed a contract for 12 AgustaWestland AW101 helicopters for VVIP transport. After Italian authorities arrested the CEO of parent company Finmeccanica in February 2013, the CBI alleged that bribes had been paid through middlemen and that specifications were changed to favour the company. India cancelled the contract in January 2014.",
    impact: "Contract worth about ₹3,600 crore; the CBI alleged roughly ₹250 crore in bribes routed through the UK and the UAE.",
    outcome:
      "Italian courts finally acquitted Finmeccanica's CEO Giuseppe Orsi (2019) and middleman Guido Haschke (2025). In India the CBI case against former IAF chief S. P. Tyagi and others is continuing; Christian Michel was extradited in December 2018 and remains an accused.",
    entityIds: [],
    assignedInvestigators: [agency("Central Bureau of Investigation", "CBI"), agency("Enforcement Directorate", "ED")],
    createdAt: "2013-02-12T00:00:00+05:30",
    updatedAt: REVIEWED,
    sources: [
      link("ThePrint", "AgustaWestland chopper scam: court dismisses Christian Michel's extradition-papers pleas", "https://theprint.in/judiciary/agustawestland-vvip-chopper-scam-case-court-dismisses-christian-michels-extradition-papers-pleas/2790070/"),
      link("The Tribune", "AgustaWestland chopper scam: court orders Christian Michel's release in ED case", "https://www.tribuneindia.com/news/india/agustawestland-chopper-scam-court-orders-christian-michels-release-from-custody-in-ed-case/"),
      wiki("2013 Indian helicopter bribery scandal", "2013_Indian_helicopter_bribery_scandal"),
    ],
    images: [commons("AgustaWestland HH-101A Caesar (cropped).jpg", "An AgustaWestland AW101 (HH-101A) helicopter", "Gian Marco Anzellotti", "CC BY 2.0")],
  },
];
