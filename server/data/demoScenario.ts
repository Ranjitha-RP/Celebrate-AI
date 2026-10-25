import {
  EventInput,
  Plan,
  BudgetAllocation,
  Task,
  Guest,
  InvitationBundle,
  ChatMessage,
} from "../../src/shared/schemas.ts";

export const DEMO_EVENT_INPUT: EventInput = {
  title: "Vatsala & Krishnan's 50th Golden Wedding Anniversary",
  eventType: "anniversary",
  subTradition: "South Indian Golden Jubilee (Suvarna Mahotsava)",
  date: "2026-12-12",
  city: "Bengaluru",
  guestCount: 120,
  totalBudget: 500000,
  vibePreferences:
    "Warm heritage courtyard, Mysore jasmine & antique gold, Carnatic flute & nostalgic 1970s melodies, elder-friendly seating",
  dietaryNeeds: ["Pure Veg", "Jain Friendly"],
};

export const DEMO_PLAN: Plan = {
  summaryPitch:
    "An intimate dusk courtyard Suvarna Mahotsava in Jayanagar for 120 loved ones—combining stone-pillared heritage warmth, a 22-item heirloom banana-leaf & Jain feast, live Carnatic flute-veena melodies, and a 50-year archival family gallery within ₹5,00,000.",
  theme: {
    name: "Suvarna Mallige & Kanjeevaram Gold",
    sourceThemeId: "THM-01",
    sourceThemeName: "Suvarna Mallige & Kanjeevaram Gold",
    description:
      "Honoring five decades of companionship with handwoven kumkum-crimson and antique zari silk runners, cascading Mysore mallige garlands, brass urlis floating diyas, and an archival black-and-white photo walk from 1976 to 2026.",
    palette: ["#BE123C", "#D97706", "#FEF3C7", "#1C1917", "#15803D"],
    paletteNames: [
      "Kumkum Crimson",
      "Antique Zari Gold",
      "Mysore Ivory",
      "Deep Ebony",
      "Mango Leaf Green",
    ],
    moodBoardDescription:
      "Stone courtyard pillars draped in unbleached mulmul and strings of fresh Mysore jasmine; brass kuthuvilakku lamps flanking a raised cushioned swing (oonjal) for the couple; wooden dining tables dressed in crimson Kanjeevaram borders and banana leaves.",
  },
  venueSuggestions: [
    {
      title: "Primary Courtyard Venue",
      citedVendorId: "VEN-BLR-01",
      citedVendorName: "Tamarind Courtyard & Heritage Mandapa",
      estimatedCostInr: 145000,
      highlights: [
        "1940s stone-pillared Jayanagar courtyard ideal for 120 guests",
        "Step-free wheelchair & elder access with rain-safe glass veranda",
        "Dedicated bridal/elder green rooms and valet parking",
      ],
      rationale:
        "Matches Bengaluru heritage courtyard vibe and comfortably hosts 120 seated guests within the 29% venue allocation.",
    },
    {
      title: "Value Garden Alternative",
      citedVendorId: "VEN-BLR-02",
      citedVendorName: "The Banyan Veranda Boutique Lawns",
      estimatedCostInr: 105000,
      highlights: [
        "Terracotta veranda & manicured banyan lawn in Indiranagar",
        "Saves ₹40,000 if reallocating toward live music or photography",
      ],
      rationale:
        "High-rated backup option in Bengaluru if you prefer an open garden lawn setting.",
    },
  ],
  cateringPlan: {
    citedVendorId: "VEN-BLR-04",
    citedVendorName: "Mavalli Royal Leaf Caterers",
    perPlateInr: 1200,
    estimatedTotalInr: 150000,
    dietaryComplianceNote:
      "100% Pure Vegetarian kitchen with a dedicated no-onion, no-garlic Jain & Sattvik counter for 30+ senior guests (includes 5% buffer plates).",
    welcomeDrinks: [
      "Elaneer (Tender Coconut) & Mint Cooler",
      "Warm Spiced Badam Paal in Brass Tumblers",
      "Nannari Lemon Sherbet",
    ],
    starters: [
      "Crispy Maddur Vada with Fresh Coconut Chutney",
      "Mini Ghee Podi Idli Skewers",
      "Jain Corn & Pomegranate Paniyaram",
    ],
    mainCourse: [
      "Live Kayi Holige (Coconut-Jaggery Obbattu) drizzled with Pure Ghee",
      "Heirloom Bisibelebath & Kara Boondi",
      "Sattvik No-Onion Avial & Pineapple Gojju",
      "Malabar Parotta with Vegetable Kurma & Curd Rice with Pomegranate",
    ],
    desserts: [
      "Warm Melt-in-Mouth Mysore Pak",
      "Elaneer (Tender Coconut) Payasam",
      "Artisanal Brass-Davara Chikmagalur Filter Coffee",
    ],
    rationale:
      "Mavalli Royal Leaf Caterers (★ 4.9) is Bengaluru's top-cited specialist for Pure Veg & Jain heirloom Karnataka feasts at ₹1,200/guest.",
  },
  decorPlan: {
    title: "Zero-Plastic Jasmine, Brass & Archival Gallery",
    citedVendorId: "VEN-BLR-06",
    citedVendorName: "Hoovu & Brass Atelier",
    estimatedCostInr: 75000,
    highlights: [
      "Mysore mallige & marigold entrance torans with 12 brass urlis",
      "'50 Golden Years' curated archival family photo corridor with warm Edison lights",
      "Cushioned Kanjeevaram crimson-gold stage backdrop for garland exchange",
    ],
    rationale:
      "Delivers authentic South Indian temple-courtyard aesthetics without synthetic floral foam.",
  },
  entertainmentPlan: {
    title: "Carnatic Flute-Veena & 1970s Retro Acoustic Evening",
    citedVendorId: "VEN-BLR-08",
    citedVendorName: "Swara Carnatic Acoustic Collective",
    estimatedCostInr: 50000,
    highlights: [
      "Auspicious Raga Anandabhairavi welcome during Deepa Prajwalana",
      "Nostalgic 1970s Kannada & Hindi acoustic classics from the couple's wedding era",
      "Gentle decibel calibration (<72 dB) so elders can converse comfortably",
    ],
    rationale:
      "Creates deeply personal generational nostalgia while honoring traditional South Indian rituals.",
  },
  photographyPlan: {
    title: "Documentary Candid & Same-Evening Memoir Reel",
    citedVendorId: "VEN-BLR-10",
    citedVendorName: "Katha Candid Frames",
    estimatedCostInr: 55000,
    highlights: [
      "2 candid photographers + 1 4K filmmaker for 6 hours",
      "Dedicated multi-generational family portrait corner",
      "Linen-bound 50th Anniversary heirloom print album",
    ],
    rationale:
      "Preserves rare multi-generational portraits and unscripted storytelling within budget.",
  },
  culturalAdvisory: {
    sourceCultureId: "CUL-01",
    sourceCultureTitle:
      "South Indian Milestone Anniversary & Suvarna Mahotsava",
    muhuratWindow:
      "Saturday, 12 Dec 2026 · Godhuli / Vijaya Dusk Window: 5:48 PM – 6:42 PM (Rahu Kaal ends before 10:30 AM; evening Pradosha window is highly auspicious for Deepa Prajwalana & Maalai Maatral).",
    rituals: [
      "Deepa Prajwalana (5:55 PM): Couple & grandchildren light the five-wick brass Kuthuvilakku.",
      "Suvarna Maalai Maatral (6:15 PM): Exchange of Mysore jasmine & rose garlands celebrating 50 years.",
      "Pada Puja & Ashirvada (6:30 PM): Children honour parents with silk angavastram and receive akshata blessings.",
      "Mangala Tambulam: Departing guests receive betel leaves, turmeric-kumkum, coconut, and Mysore pak box.",
    ],
    regionalFoodNotes: [
      "Serve seated banana-leaf batch 1 at 7:30 PM specifically for senior citizens.",
      "Keep Jain no-onion-no-garlic vessels clearly labelled and served with separate ladles.",
    ],
    etiquetteTip:
      "Reserve the front two rows of cushioned chairs with armrests near the stage exclusively for guests aged 70+.",
  },
  runSheet: [
    {
      id: "RS-01",
      time: "03:30 PM",
      activity: "Courtyard handover, floral toran & 50-year photo gallery installation",
      owner: "Decor Lead",
      vendorCategory: "decor",
      vendorContact: "Hoovu & Brass Atelier (+91 98450 11206)",
      arrivalTime: "02:30 PM",
      status: "completed",
    },
    {
      id: "RS-02",
      time: "04:45 PM",
      activity: "Soundcheck for flute-veena quartet & wireless family toast mics",
      owner: "Audio Lead",
      vendorCategory: "entertainment",
      vendorContact: "Swara Carnatic Collective (+91 98450 11208)",
      arrivalTime: "04:15 PM",
      status: "arrived",
    },
    {
      id: "RS-03",
      time: "05:15 PM",
      activity: "Couple & immediate family golden-hour courtyard portraits",
      owner: "Photo Lead",
      vendorCategory: "photography",
      vendorContact: "Katha Candid Frames (+91 98450 11210)",
      arrivalTime: "04:45 PM",
      status: "scheduled",
    },
    {
      id: "RS-04",
      time: "05:45 PM",
      activity: "Guest arrival, chandan welcome & tender coconut / badam paal service",
      owner: "Family Host",
      vendorCategory: "catering",
      vendorContact: "Mavalli Royal Leaf (+91 98450 11204)",
      arrivalTime: "04:00 PM",
      status: "scheduled",
    },
    {
      id: "RS-05",
      time: "06:00 PM",
      activity: "Auspicious Deepa Prajwalana, Maalai Maatral & Ashirvada ceremony",
      owner: "Children & Couple",
      vendorCategory: "venue",
      vendorContact: "Tamarind Courtyard (+91 98450 11201)",
      arrivalTime: "02:00 PM",
      status: "scheduled",
    },
    {
      id: "RS-06",
      time: "06:50 PM",
      activity: "Grandchildren's 5-decade story toast & 1976 memory slideshow",
      owner: "Rohan & Ananya (Grandkids)",
      vendorCategory: "entertainment",
      vendorContact: "Swara Carnatic Collective (+91 98450 11208)",
      arrivalTime: "04:15 PM",
      status: "scheduled",
    },
    {
      id: "RS-07",
      time: "07:35 PM",
      activity: "Seated Banana-Leaf & Jain Festive Dinner + Live Holige & Filter Coffee",
      owner: "Catering Head",
      vendorCategory: "catering",
      vendorContact: "Mavalli Royal Leaf (+91 98450 11204)",
      arrivalTime: "04:00 PM",
      status: "scheduled",
    },
    {
      id: "RS-08",
      time: "09:15 PM",
      activity: "Tambulam return-gift distribution & warm send-off",
      owner: "Family Welcome Desk",
      vendorCategory: "misc",
      vendorContact: "Family Coordinator",
      arrivalTime: "05:30 PM",
      status: "scheduled",
    },
  ],
  generatedVia: "cached-demo-fallback",
};

export const DEMO_BUDGET: BudgetAllocation[] = [
  {
    category: "venue",
    label: "Venue & Courtyard Rental",
    plannedAmount: 145000,
    actualSpent: 75000,
    minPct: 20,
    maxPct: 40,
    priorityWeight: 1.2,
    locked: false,
    rationale: "Covers Tamarind Courtyard evening buyout, valet, and power backup (₹75k advance paid).",
  },
  {
    category: "catering",
    label: "Festive Catering & Filter Coffee Bar",
    plannedAmount: 150000,
    actualSpent: 50000,
    minPct: 24,
    maxPct: 44,
    priorityWeight: 1.4,
    locked: false,
    rationale: "120 guests + 5 buffer plates @ ₹1,200/plate with separate Jain sattvik station.",
  },
  {
    category: "decor",
    label: "Floral, Brass & Archival Gallery Decor",
    plannedAmount: 75000,
    actualSpent: 25000,
    minPct: 10,
    maxPct: 24,
    priorityWeight: 1.0,
    locked: false,
    rationale: "Fresh Mysore mallige canopies, brass urlis, and 50-year framed photo walk.",
  },
  {
    category: "entertainment",
    label: "Live Carnatic & Retro Ensemble",
    plannedAmount: 50000,
    actualSpent: 15000,
    minPct: 6,
    maxPct: 18,
    priorityWeight: 0.9,
    locked: false,
    rationale: "4-piece acoustic ensemble + subtle courtyard sound reinforcement.",
  },
  {
    category: "photography",
    label: "Candid Photography & Heirloom Film",
    plannedAmount: 55000,
    actualSpent: 20000,
    minPct: 7,
    maxPct: 18,
    priorityWeight: 1.0,
    locked: false,
    rationale: "Candid photo + 4K memoir reel + linen print album.",
  },
  {
    category: "misc",
    label: "Tambulam Favours, Silk & Contingency",
    plannedAmount: 25000,
    actualSpent: 8000,
    minPct: 5,
    maxPct: 15,
    priorityWeight: 0.7,
    locked: false,
    rationale: "60 family Tambulam Mysore pak boxes + ₹7,000 emergency buffer.",
  },
];

export function buildDemoTasks(eventId: string, eventDate: string): Task[] {
  const base = new Date(eventDate + "T00:00:00");
  const fmt = (daysBefore: number) => {
    const d = new Date(base);
    d.setDate(d.getDate() - daysBefore);
    return d.toISOString().slice(0, 10);
  };

  return [
    {
      id: `TSK-${eventId}-1`,
      eventId,
      title: "Confirm Tamarind Courtyard Jayanagar & pay 50% booking advance",
      category: "venue",
      dueDate: fmt(45),
      daysBefore: 45,
      priority: "high",
      completed: true,
    },
    {
      id: `TSK-${eventId}-2`,
      eventId,
      title: "Scan 30 vintage family photographs (1976–2026) for courtyard gallery",
      category: "decor",
      dueDate: fmt(30),
      daysBefore: 30,
      priority: "medium",
      completed: true,
    },
    {
      id: `TSK-${eventId}-3`,
      eventId,
      title: "Tasting session with Mavalli Royal Leaf (finalize Jain no-onion menu)",
      category: "catering",
      dueDate: fmt(25),
      daysBefore: 25,
      priority: "high",
      completed: true,
    },
    {
      id: `TSK-${eventId}-4`,
      eventId,
      title: "Share trilingual RSVP link (English, Hindi, Kannada) on family groups",
      category: "guests",
      dueDate: fmt(21),
      daysBefore: 21,
      priority: "high",
      completed: false,
    },
    {
      id: `TSK-${eventId}-5`,
      eventId,
      title: "Share 1970s favourite Kannada & Hindi song list with Swara Collective",
      category: "entertainment",
      dueDate: fmt(14),
      daysBefore: 14,
      priority: "medium",
      completed: false,
    },
    {
      id: `TSK-${eventId}-6`,
      eventId,
      title: "Order 65 Tambulam return-gift bags with fresh Mysore Pak & kumkum",
      category: "misc",
      dueDate: fmt(10),
      daysBefore: 10,
      priority: "medium",
      completed: false,
    },
    {
      id: `TSK-${eventId}-7`,
      eventId,
      title: "Lock final confirmed headcount & Jain plate count with caterer",
      category: "catering",
      dueDate: fmt(5),
      daysBefore: 5,
      priority: "high",
      completed: false,
    },
    {
      id: `TSK-${eventId}-8`,
      eventId,
      title: "Confirm wheelchair ramp & front-row cushioned chairs for senior elders",
      category: "venue",
      dueDate: fmt(2),
      daysBefore: 2,
      priority: "high",
      completed: false,
    },
  ];
}

export function buildDemoGuests(eventId: string): Guest[] {
  return [
    {
      id: `GST-${eventId}-1`,
      eventId,
      name: "Dr. Narasimha & Sharada Murthy",
      contact: "+91 98451 20110",
      status: "yes",
      partySize: 4,
      dietaryPreference: "Pure Veg",
      notes: "Elders — reserve front-row cushioned seating",
    },
    {
      id: `GST-${eventId}-2`,
      eventId,
      name: "Mahaveer & Kavita Jain Family",
      contact: "+91 98802 44192",
      status: "yes",
      partySize: 5,
      dietaryPreference: "Jain",
      notes: "Strictly no onion, garlic, or root vegetables",
    },
    {
      id: `GST-${eventId}-3`,
      eventId,
      name: "Siddharth & Deepa Rao",
      contact: "deepa.rao@example.com",
      status: "yes",
      partySize: 3,
      dietaryPreference: "Pure Veg",
      notes: "Arriving from Mysuru by 5:30 PM",
    },
    {
      id: `GST-${eventId}-4`,
      eventId,
      name: "Vikram & Neha Kulkarni",
      contact: "+91 99001 88321",
      status: "pending",
      partySize: 4,
      dietaryPreference: "Pure Veg",
      notes: "Awaiting flight confirmation from Mumbai",
    },
    {
      id: `GST-${eventId}-5`,
      eventId,
      name: "Lakshmi & Sundararajan Iyer",
      contact: "+91 98404 71209",
      status: "yes",
      partySize: 2,
      dietaryPreference: "Pure Veg",
      notes: "Bringing vintage 1976 wedding album",
    },
    {
      id: `GST-${eventId}-6`,
      eventId,
      name: "Arjun & Tanya Menon",
      contact: "arjun.m@example.com",
      status: "no",
      partySize: 2,
      dietaryPreference: "Vegan",
      notes: "Travelling overseas — sending floral hamper",
    },
    {
      id: `GST-${eventId}-7`,
      eventId,
      name: "Prakash & Geetha Hegde Family",
      contact: "+91 98455 66210",
      status: "pending",
      partySize: 4,
      dietaryPreference: "Jain",
      notes: "",
    },
  ];
}

export const DEMO_INVITATION: InvitationBundle = {
  tone: "Warm Traditional",
  hostLine: "Hosted with love by Ananya, Karthik & Grandchildren",
  english: {
    headline: "Fifty Golden Years of Grace, Laughter & Companionship",
    body: "With joyful hearts, we invite your family to celebrate the Suvarna Mahotsava (50th Wedding Anniversary) of Smt. Vatsala & Sri Krishnan. Join us for an evening of Deepa Prajwalana, Carnatic flute melodies, shared memories, and a traditional festive banana-leaf dinner under the courtyard lanterns.",
    rsvpNote:
      "Saturday, 12 December 2026 · 5:45 PM onwards · Tamarind Courtyard, Jayanagar, Bengaluru. Your blessings are our greatest gift.",
  },
  hindi: {
    headline: "स्नेह, संस्कार और साथ के ५० स्वर्णिम वर्ष",
    body: "सप्रेम नमस्कार। श्रीमती वत्सला एवं श्री कृष्णन की ५०वीं वैवाहिक वर्षगांठ (स्वर्ण जयंती समारोह) के शुभ अवसर पर हम आपको सपरिवार सादर आमंत्रित करते हैं। दीप प्रज्वलन, मधुर संगीत और पारंपरिक रात्रिभोज में आपकी उपस्थिति एवं आशीर्वाद हमारे आनंद को दोगुना करेंगे।",
    rsvpNote:
      "शनिवार, १२ दिसंबर २०२६ · सायं ५:४५ बजे से · टैमरिंड कोर्टयार्ड, जयनगर, बेंगलुरु।",
  },
  kannada: {
    headline: "ಪ್ರೀತಿ, ಸಂಸ್ಕಾರ ಮತ್ತು ಸಹಬಾಳ್ವೆಯ ೫೦ ಸುವರ್ಣ ವರ್ಷಗಳು",
    body: "ಆತ್ಮೀಯರೇ, ಶ್ರೀಮತಿ ವತ್ಸಲಾ ಮತ್ತು ಶ್ರೀ ಕೃಷ್ಣನ್ ಅವರ ವಿವಾಹದ ಸುವರ್ಣ ಮಹೋತ್ಸವದ (೫೦ನೇ ವಾರ್ಷಿಕೋತ್ಸವ) ಶುಭ ಸಮಾರಂಭಕ್ಕೆ ತಮಗೆಲ್ಲರಿಗೂ ಸಕುಟುಂಬ ಸಪರಿವಾರದವರಾಗಿ ಹೃತ್ಪೂರ್ವಕ ಸ್ವಾಗತ. ದೀಪ ಪ್ರಜ್ವಲನೆ, ಕರ್ನಾಟಕ ಕೊಳಲು ನಾದ ಮತ್ತು ಸಂಪ್ರದಾಯಬದ್ಧ ಬಾಳೆಎಲೆ ಭೋಜನದಲ್ಲಿ ಪಾಲ್ಗೊಂಡು ಹಿರಿಯರ ಆಶೀರ್ವಾದ ಪಡೆಯಬೇಕಾಗಿ ವಿನಂತಿ.",
    rsvpNote:
      "ಶನಿವಾರ, ೧೨ ಡಿಸೆಂಬರ್ ೨೦೨೬ · ಸಂಜೆ ೫:೪೫ ರಿಂದ · ಟ್ಯಾಮರಿಂಡ್ ಕೋರ್ಟ್‌ಯಾರ್ಡ್, ಜಯನಗರ, ಬೆಂಗಳೂರು.",
  },
};

export const DEMO_CHAT_HISTORY: ChatMessage[] = [
  {
    id: "MSG-DEMO-1",
    role: "assistant",
    content:
      "Namaskara! I have prepared Vatsala & Krishnan's 50th Anniversary blueprint grounded in Bengaluru's curated vendor & cultural dataset. Try asking me: 'Reduce total budget by 20%', 'Swap to a lively bilingual DJ & emcee', or 'Add live kesar badam kulfi to the menu'.",
    createdAt: new Date().toISOString(),
  },
];
