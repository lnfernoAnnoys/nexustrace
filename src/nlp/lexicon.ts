// Word lists the extractor uses. Everything here is plain data, so it is easy to extend.

export const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh",
  "Chandigarh", "Puducherry", "Andaman and Nicobar", "Lakshadweep", "Dadra and Nagar Haveli", "Daman and Diu",
  "NCR", "Delhi NCR",
];

export const CITIES = [
  "New Delhi", "Delhi", "Mumbai", "Navi Mumbai", "Thane", "Pune", "Nagpur", "Nashik", "Aurangabad", "Kolkata",
  "Howrah", "Siliguri", "Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli", "Bengaluru", "Bangalore",
  "Mysuru", "Mysore", "Mangaluru", "Hubballi", "Belagavi", "Hyderabad", "Secunderabad", "Warangal",
  "Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur",
  "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar", "Jaipur", "Jodhpur", "Udaipur", "Kota",
  "Ajmer", "Bikaner", "Alwar", "Lucknow", "Kanpur", "Varanasi", "Agra", "Meerut", "Prayagraj", "Allahabad",
  "Ghaziabad", "Noida", "Greater Noida", "Gorakhpur", "Bareilly", "Aligarh", "Moradabad", "Mathura", "Saharanpur",
  "Gurugram", "Gurgaon", "Faridabad", "Sonipat", "Panipat", "Rohtak", "Karnal", "Hisar", "Ambala", "Bhopal",
  "Indore", "Jabalpur", "Gwalior", "Ujjain", "Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Ranchi", "Jamshedpur",
  "Dhanbad", "Bokaro", "Bhubaneswar", "Cuttack", "Rourkela", "Raipur", "Bilaspur", "Bhilai", "Guwahati",
  "Dibrugarh", "Imphal", "Shillong", "Aizawl", "Kohima", "Agartala", "Itanagar", "Gangtok", "Dehradun",
  "Haridwar", "Rishikesh", "Haldwani", "Shimla", "Chandigarh", "Mohali", "Panchkula", "Ludhiana", "Amritsar",
  "Jalandhar", "Patiala", "Bathinda", "Srinagar", "Jammu", "Leh", "Panaji", "Margao", "Vasco", "Puducherry",
  "Kolhapur", "Solapur", "Amravati", "Nanded", "Vasai", "Virar", "Bhiwandi", "Kalyan", "Dombivli", "Ulhasnagar",
  "Malegaon", "Jalgaon", "Sangli", "Ratnagiri", "Kannur", "Kollam", "Alappuzha", "Palakkad", "Malappuram",
  "Vile Parle", "Andheri", "Bandra", "Colaba", "Dadar", "Nariman Point", "Worli", "Juhu", "Powai", "Borivali",
  "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Muzaffarabad", "Dubai", "Abu Dhabi", "Sharjah", "London", "Paris",
  "Rome", "Geneva", "Zurich", "Singapore", "Hong Kong", "Kathmandu", "Colombo", "Dhaka", "Kabul", "Chicago",
  "Washington", "New York", "Texas", "California", "Tunis", "Tunisia", "Cairo",
  "United States", "United Kingdom", "United Arab Emirates", "UAE", "USA", "UK", "Pakistan", "Italy", "Switzerland",
  "Canada", "Nepal", "Bangladesh", "Sri Lanka", "Afghanistan", "Germany", "France", "Mauritius", "Antigua",
  "Tuticorin", "Vellore", "Erode", "Tiruppur", "Nellore", "Kurnool", "Rajahmundry", "Kakinada", "Karimnagar",
  "Nizamabad", "Khammam", "Ballari", "Davangere", "Kalaburagi", "Shivamogga", "Tumakuru", "Udupi", "Petrapole",
  "Mundra", "Kandla", "Nhava Sheva", "Jaisalmer", "Barmer", "Sri Ganganagar", "Bharatpur", "Sikar", "Pali",
  "Mewat", "Nuh", "Palwal", "Bulandshahr", "Muzaffarnagar", "Shamli", "Baghpat", "Hapur", "Sitapur", "Bahraich",
  "Azamgarh", "Ballia", "Mau", "Jaunpur", "Sultanpur", "Faizabad", "Ayodhya", "Kushinagar", "Deoria",
  "Darbhanga", "Purnia", "Araria", "Kishanganj", "Sitamarhi", "Siwan", "Chhapra", "Nalanda", "Hazaribagh",
  "Giridih", "Deoghar", "Pakur", "Sahibganj", "Malda", "Murshidabad", "Nadia", "Cooch Behar", "Jalpaiguri",
];

/** Words that make a capitalised phrase a place: "Ashoka Enclave", "Riverside Farmhouse". */
export const PLACE_SUFFIX = new Set([
  "nagar", "colony", "enclave", "vihar", "road", "marg", "chowk", "market", "bazaar", "bazar", "pur", "puri",
  "bagh", "gali", "village", "airport", "port", "highway", "junction", "farmhouse", "warehouse", "godown",
  "hotel", "lodge", "dhaba", "apartments", "society", "complex", "tower", "towers", "mall", "camp", "border",
  "ghat", "basti", "mohalla", "layout", "extension", "district", "tehsil", "taluka", "block", "cantonment",
  "temple", "mosque", "church", "school", "college", "hospital", "factory", "plant", "godam", "residency",
  "heights", "gardens", "park", "square", "circle", "crossing", "stand", "terminal", "harbour", "harbor", "house",
]);

/** Numbered places: "Sector 21", "Phase 2", "Plot 14". */
export const NUMBERED_PLACE = new Set(["sector", "phase", "plot", "flat", "ward", "block", "house", "shop", "gali", "lane"]);

/** A capitalised phrase ending in one of these is a company, firm or gang. */
export const ORG_SUFFIX = new Set([
  "pvt", "ltd", "limited", "llp", "private", "enterprises", "enterprise", "traders", "trader", "trading",
  "industries", "corporation", "corp", "company", "co", "bank", "finance", "fintech", "solutions", "services",
  "exports", "export", "imports", "import", "foundation", "trust", "society", "association", "forex", "bullion",
  "jewellers", "jewelers", "motors", "travels", "logistics", "agency", "syndicate", "gang", "group", "cartel",
  "module", "network", "cell", "associates", "consultancy", "developers", "infra", "infrastructure", "realty",
  "holdings", "capital", "securities", "exchange", "hawala", "syndicates", "brothers", "bros", "sons",
  "cooperative", "cooperatives", "traders.", "labs", "technologies", "systems", "media", "films", "studios",
]);

/** Banks and other institutions that appear in reports but are not suspects. */
export const BANKS = [
  "State Bank of India", "SBI", "HDFC", "ICICI", "Axis", "Punjab National Bank", "PNB", "Kotak", "Kotak Mahindra",
  "Bank of Baroda", "BoB", "Canara", "Union Bank", "IDFC", "IDFC First", "Yes Bank", "IndusInd", "Paytm Payments",
  "Bank of India", "Central Bank of India", "Indian Bank", "Indian Overseas Bank", "UCO", "Bandhan", "Federal",
  "South Indian Bank", "RBL", "Karur Vysya", "AU Small Finance", "Equitas", "Ujjivan", "PhonePe", "Google Pay",
  "Paytm", "Airtel Payments", "India Post Payments", "Cosmos", "Saraswat", "Punjab and Sind",
];

/** Investigating bodies, courts and agencies. Listed separately and not added to the network. */
export const AGENCIES = [
  "CBI", "NIA", "ED", "NCB", "ATS", "STF", "SIT", "RBI", "SEBI", "FIU", "FIU-IND", "DRI", "CID", "IB", "RAW",
  "BSF", "CRPF", "CISF", "ITBP", "SSB", "NSG", "RPF", "GRP", "CCB", "EOW", "SFIO", "CERT-In", "I4C", "UIDAI",
  "Enforcement Directorate", "Central Bureau of Investigation", "National Investigation Agency",
  "Narcotics Control Bureau", "Crime Branch", "Special Cell", "Special Task Force", "Anti-Terror Squad",
  "Economic Offences Wing", "Cyber Crime Cell", "Cyber Cell", "High Court", "Supreme Court", "Sessions Court",
  "District Court", "Customs", "Income Tax Department", "Directorate of Revenue Intelligence",
  "Financial Intelligence Unit", "Ministry of Home Affairs", "MHA", "Interpol", "Europol",
];

export const OFFICIAL_TITLES = [
  "Inspector", "Insp", "Inspr", "Sub-Inspector", "Sub Inspector", "SI", "ASI", "SHO", "DCP", "ACP", "SP", "DSP",
  "IG", "IGP", "DIG", "ADGP", "DGP", "CP", "Commissioner", "Constable", "Head Constable", "HC", "Superintendent",
  "Magistrate", "Judge", "Justice", "Public Prosecutor", "Prosecutor", "Officer", "Additional SP", "Addl SP",
  "Investigating Officer", "IO",
];

export const PERSON_TITLES = ["Shri", "Sh", "Smt", "Mr", "Mrs", "Ms", "Miss", "Dr", "Prof", "Sri", "Late", "Km", "Kumari"];

/** Words seen just before a name that make it very likely to be a person. */
export const PERSON_CUES_BEFORE = new Set([
  "accused", "arrested", "apprehended", "suspect", "suspects", "absconding", "named", "alias", "aka", "urf",
  "complainant", "victim", "informant", "witness", "co-accused", "coaccused", "associate", "aide", "kingpin",
  "mastermind", "gangster", "smuggler", "peddler", "dealer", "one", "namely", "by", "operative", "handler",
  "accomplice", "conspirator", "brother", "sister", "father", "mother", "wife", "husband", "son", "daughter",
  "uncle", "nephew", "cousin", "cousins", "s/o", "d/o", "w/o", "c/o", "with", "and", "against", "from",
]);

/** Words that are capitalised in a sentence but are not names. */
export const STOP_WORDS = new Set([
  "The", "This", "That", "These", "Those", "On", "In", "At", "By", "For", "From", "With", "During", "After",
  "Before", "Further", "However", "Also", "Accordingly", "Later", "Meanwhile", "It", "He", "She", "They", "His",
  "Her", "Their", "Its", "Police", "Station", "Report", "Section", "Act", "Court", "Case", "FIR", "Complaint",
  "Accused", "Victim", "Informant", "Witness", "Officer", "Team", "Unit", "Department", "Government", "State",
  "Central", "National", "District", "Special", "Crime", "Branch", "Cell", "Squad", "Force", "Bureau", "Agency",
  "Investigation", "Suspicious", "Transaction", "Analysis", "Aggregated", "Multiple", "Field", "Further",
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "January", "February", "March",
  "April", "May", "June", "July", "August", "September", "October", "November", "December", "Jan", "Feb", "Mar",
  "Apr", "Jun", "Jul", "Aug", "Sep", "Sept", "Oct", "Nov", "Dec", "Mr", "Mrs", "Ms", "Dr", "Shri", "Smt", "Sh",
  "Prof", "Sri", "Miss", "Late", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "According", "Based", "Following", "Upon", "Subsequently", "Thereafter", "Otherwise", "Since", "While",
  "When", "Where", "Which", "Who", "Whom", "Whose", "What", "Why", "How", "If", "Then", "There", "Here", "As",
  "But", "And", "Or", "Nor", "So", "Yet", "Not", "No", "Yes", "All", "Any", "Some", "Many", "Most", "Other",
  "Such", "Both", "Each", "Every", "Either", "Neither", "Another", "Once", "Again", "Still", "Just", "Only",
  "Even", "Very", "Well", "Now", "New", "Old", "First", "Second", "Third", "Last", "Next", "Same", "Small",
  "Large", "Major", "Minor", "Senior", "Junior", "Chief", "Head", "Assistant", "Deputy", "Additional",
  "Indian", "India", "Penal", "Code", "Information", "Bharatiya", "Nyaya", "Sanhita", "Narcotic", "Drugs",
  "Psychotropic", "Substances", "Prevention", "Money", "Laundering", "Unlawful", "Activities", "Arms",
  "Explosive", "Prohibition", "Corruption", "Company", "Companies", "Bank", "Banks", "Account", "Accounts",
  "Mobile", "Phone", "Number", "Vehicle", "Motor", "Car", "Truck", "Bike", "Scooter", "Rs", "INR", "IPC", "BNS",
  "CrPC", "BNSS", "NDPS", "PMLA", "UAPA", "MCOCA", "POCSO", "WhatsApp", "Telegram", "Facebook", "Instagram",
  "Twitter", "YouTube", "Google", "Gmail", "Aadhaar", "Aadhar", "PAN", "UPI", "OTP", "ATM", "GST", "CCTV",
  "News", "Times", "Hindu", "Express", "Today", "Hindustan", "Tribune", "Reuters", "PTI", "ANI", "IANS",
  "Kingpin", "Mastermind", "Gangster", "Suspect", "Suspects", "Absconding", "Arrested", "Apprehended",
  "Complainant", "Associate", "Associates", "Aide", "Smuggler", "Peddler", "Dealer", "Operative", "Handler",
  "Accomplice", "Alias", "Namely", "Believed", "Inspector", "Constable", "Sub", "Commissioner", "Superintendent",
  "During", "Upon", "Within", "Without", "Through", "Over", "Under", "Between", "Among", "Against", "Recovered",
  "Seized", "Searched", "Raided", "Interrogation", "Investigation", "Preliminary", "Initial", "Total", "Approximately",
  "Cyber", "Crime", "Cell", "Fake", "Online", "Digital", "Mobile", "Bank", "Money", "Cash", "Gold", "Drugs",
]);

/** Vehicle makes, models and colours: capitalised words that must not be read as names. */
export const VEHICLE_WORDS = new Set([
  "Mahindra", "Scorpio", "Maruti", "Suzuki", "Swift", "Innova", "Toyota", "Honda", "City", "Hyundai", "Creta",
  "Tata", "Nexon", "Bolero", "Royal", "Enfield", "Bajaj", "Pulsar", "Activa", "Fortuner", "Thar", "Ertiga",
  "Brezza", "Kia", "Ford", "Volkswagen", "Skoda", "Renault", "Nissan", "Yamaha", "Hero", "Splendor", "TVS",
  "Alto", "Wagon", "Baleno", "Dzire", "Verna", "Harrier", "Safari", "XUV", "Sedan", "SUV", "Tempo", "Canter",
  "Eicher", "Ashok", "Leyland", "Grey", "Gray", "Black", "White", "Red", "Blue", "Silver", "Green", "Maroon",
  "Yellow", "Brown", "Orange", "Golden",
]);

/** Legal acts and what kind of offence they point to. */
export const ACT_CATEGORY: Record<string, string> = {
  NDPS: "Narcotics",
  PMLA: "Money laundering",
  UAPA: "Terror / unlawful activities",
  MCOCA: "Organised crime",
  "IT ACT": "Cyber crime",
  "ARMS ACT": "Arms / weapons",
  "PC ACT": "Corruption",
  POCSO: "Crimes against children",
  "EXPLOSIVE SUBSTANCES ACT": "Explosives / terror",
  "IMMORAL TRAFFIC": "Human trafficking",
  FEMA: "Foreign exchange / hawala",
  "CUSTOMS ACT": "Smuggling",
  "WILDLIFE": "Wildlife crime",
};

/** IPC / BNS sections that are commonly cited. */
export const SECTION_CATEGORY: Record<string, string> = {
  "302": "Murder", "307": "Attempt to murder", "304": "Culpable homicide", "103": "Murder", "109": "Attempt to murder",
  "420": "Cheating / fraud", "318": "Cheating / fraud", "406": "Criminal breach of trust", "316": "Criminal breach of trust",
  "409": "Criminal breach of trust", "467": "Forgery", "468": "Forgery", "471": "Forgery", "336": "Forgery", "338": "Forgery",
  "120B": "Criminal conspiracy", "61": "Criminal conspiracy", "34": "Common intention", "3(5)": "Common intention",
  "363": "Kidnapping", "364": "Kidnapping", "365": "Kidnapping", "137": "Kidnapping", "140": "Kidnapping",
  "376": "Sexual offence", "63": "Sexual offence", "384": "Extortion", "385": "Extortion", "308": "Extortion",
  "392": "Robbery", "394": "Robbery", "309": "Robbery", "395": "Dacoity", "310": "Dacoity", "399": "Dacoity",
  "489A": "Counterfeit currency", "489B": "Counterfeit currency", "178": "Counterfeit currency",
  "121": "Waging war / terror", "147": "Rioting", "148": "Rioting", "191": "Rioting", "111": "Organised crime",
  "113": "Terrorist act", "153A": "Promoting enmity", "196": "Promoting enmity", "295A": "Promoting enmity",
  "354": "Outraging modesty", "74": "Outraging modesty", "498A": "Cruelty by husband / relatives", "85": "Cruelty by husband / relatives",
  "304B": "Dowry death", "80": "Dowry death", "201": "Destroying evidence", "238": "Destroying evidence",
  "411": "Receiving stolen property", "317": "Receiving stolen property", "379": "Theft", "303": "Theft",
  "506": "Criminal intimidation", "351": "Criminal intimidation", "66C": "Identity theft (cyber)", "66D": "Cheating by impersonation (cyber)",
  "67": "Obscene content (cyber)", "66": "Computer offences (cyber)",
};

/** Keywords that hint at the kind of crime described. */
export const CRIME_KEYWORDS: { category: string; pattern: RegExp }[] = [
  { category: "Narcotics", pattern: /\b(narcotic|narcotics|drug|drugs|heroin|charas|ganja|cannabis|opium|cocaine|mdma|methamphetamine|mephedrone|smack|brown sugar|contraband|psychotropic|drug trafficking|drug peddl\w+)\b/i },
  { category: "Money laundering / hawala", pattern: /\b(hawala|money laundering|laundering|layering|shell compan\w+|benami|round[- ]tripping|suspicious transaction|mule account|fund transfer|circular transaction)\b/i },
  { category: "Cyber crime / online fraud", pattern: /\b(phishing|cyber ?(?:crime|fraud)|online fraud|upi fraud|otp fraud|loan app\w*|sim swap|fake (?:investment )?app|harassment calls|recovery agents|sextortion|ransomware|hacking|digital arrest|investment scam|crypto|call centre|call center|vishing)\b/i },
  { category: "Fraud / cheating", pattern: /\b(cheating|fraud|forgery|forged|ponzi|chit fund|scam|misappropriat\w+|embezzl\w+|counterfeit|fake (?:document|documents|certificate|currency|notes))\b/i },
  { category: "Arms / weapons", pattern: /\b(illegal arms|arms trafficking|firearm|firearms|pistol|revolver|ammunition|cartridge|country[- ]made|weapon|weapons|explosive|explosives|ied)\b/i },
  { category: "Smuggling", pattern: /\b(smuggl\w+|customs|gold biscuit|contraband gold|wildlife|ivory|red sanders|cattle smuggling|fake indian currency notes|ficn)\b/i },
  { category: "Terror / organised crime", pattern: /\b(terror\w*|militant|militancy|jihadi|naxal\w*|maoist|extremis\w+|sleeper cell|organised crime|organized crime|syndicate|gangster|gang war|underworld)\b/i },
  { category: "Extortion / kidnapping", pattern: /\b(extort\w*|ransom|kidnap\w*|abduct\w*|protection money|hafta)\b/i },
  { category: "Violent crime", pattern: /\b(murder|homicide|killed|shot dead|stabbed|lynch\w*|attempt to murder|contract killing|supari)\b/i },
  { category: "Human trafficking", pattern: /\b(human trafficking|trafficking of|trafficked|bonded labour|flesh trade|immoral traffic)\b/i },
  { category: "Corruption", pattern: /\b(bribe|bribery|corruption|disproportionate assets|kickback|graft)\b/i },
  { category: "Betting / gambling", pattern: /\b(betting|gambling|satta|matka|online betting|ipl betting|mahadev)\b/i },
];

/** State / UT codes that can start an Indian vehicle registration number. */
export const RTO_CODES = new Set([
  "AN", "AP", "AR", "AS", "BR", "CG", "CH", "DD", "DL", "DN", "GA", "GJ", "HP", "HR", "JH", "JK", "KA", "KL", "LA",
  "LD", "MH", "ML", "MN", "MP", "MZ", "NL", "OD", "OR", "PB", "PY", "RJ", "SK", "TN", "TR", "TS", "TG", "UK", "UP",
  "UA", "WB",
]);
