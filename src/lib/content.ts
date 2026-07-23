/** Static marketing content — copy, testimonials, feature lists. */

export const AI_FEATURES = [
  { icon: "ScanSearch", title: "AI Fault Diagnosis", desc: "Describe the symptom — our model predicts the likely fault and part before the visit." },
  { icon: "MessageSquareText", title: "AI Chat Assistant", desc: "24×7 conversational help that books, reschedules and answers in seconds." },
  { icon: "Mic", title: "Voice Booking", desc: "Book hands-free. Just say what's wrong and we handle the rest." },
  { icon: "Calculator", title: "AI Price Estimator", desc: "Transparent, upfront estimates tuned to your brand, model and city." },
  { icon: "Sparkles", title: "Service Recommendation", desc: "Smart nudges for the exact service your appliance needs next." },
  { icon: "Image", title: "Image Upload Diagnosis", desc: "Snap a photo of the error or leak — vision AI reads it instantly." },
  { icon: "UserCheck", title: "AI Technician Matching", desc: "Matched to a specialist certified for your exact appliance & brand." },
  { icon: "FileSearch", title: "Complaint Analysis", desc: "Every complaint is triaged and routed in real time for fast resolution." },
  { icon: "Star", title: "AI Review Summary", desc: "Thousands of reviews distilled into what actually matters to you." },
  { icon: "BellRing", title: "Predictive Maintenance", desc: "We remind you before a small issue becomes an expensive breakdown." },
];

export const HOW_IT_WORKS = [
  { step: "01", title: "Tell us what's wrong", desc: "Pick your brand, appliance and problem — or let AI diagnose it." },
  { step: "02", title: "Choose a time", desc: "Same-day and next-day slots that fit your schedule, down to the hour." },
  { step: "03", title: "Track your expert", desc: "Watch your certified technician arrive live, with ETA and updates." },
  { step: "04", title: "Relax — it's fixed", desc: "Genuine parts, digital invoice and a 90-day warranty. Every time." },
];

export const TRUST_BADGES = [
  { icon: "ShieldCheck", title: "Certified Technicians", desc: "Trained & brand-authorised experts." },
  { icon: "FileBadge", title: "Verified Background", desc: "Every pro is police-verified." },
  { icon: "BadgeCheck", title: "90-Day Warranty", desc: "On all repairs and spare parts." },
  { icon: "Package", title: "Original Spare Parts", desc: "Genuine, brand-approved components." },
  { icon: "Zap", title: "Same-Day Service", desc: "Book by 2 PM, fixed by evening." },
  { icon: "Headset", title: "24×7 Support", desc: "Real humans, any hour, any day." },
];

export const STATS = [
  { value: "3.2M+", label: "Services completed" },
  { value: "12,000+", label: "Certified technicians" },
  { value: "4.9", label: "Average rating" },
  { value: "33", label: "Telangana districts" },
];

export interface Testimonial {
  name: string;
  city: string;
  rating: number;
  appliance: string;
  quote: string;
  initials: string;
  color: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Ananya Rao",
    city: "Hyderabad",
    rating: 5,
    appliance: "Samsung Refrigerator",
    quote:
      "The technician arrived within the hour, diagnosed the compressor issue instantly and had it running before lunch. The live tracking felt like ordering a premium cab.",
    initials: "AR",
    color: "#1E88E5",
  },
  {
    name: "Rohit Mehta",
    city: "Warangal",
    rating: 5,
    appliance: "IFB Washing Machine",
    quote:
      "I uploaded a photo of the error code and the AI already knew the part needed. Genuine spare, digital invoice, 90-day warranty. This is how service should feel.",
    initials: "RM",
    color: "#00C853",
  },
  {
    name: "Priya Nair",
    city: "Hyderabad",
    rating: 5,
    appliance: "LG Microwave",
    quote:
      "Booked by voice while cooking. Same-day slot, spotless work, and the technician cleaned up afterwards. Easily better than any service I've used before.",
    initials: "PN",
    color: "#2563EB",
  },
  {
    name: "Karan Singh",
    city: "Secunderabad",
    rating: 5,
    appliance: "Bosch Oven",
    quote:
      "The AMC plan paid for itself in one visit. Predictive alerts caught a fan issue early. Genuinely the most polished home-service experience in India.",
    initials: "KS",
    color: "#F59E0B",
  },
  {
    name: "Meera Iyer",
    city: "Nizamabad",
    rating: 5,
    appliance: "Samsung Washing Machine",
    quote:
      "Transparent pricing with no surprises, a technician who explained everything, and support that actually answered at 11 PM. Absolutely worth it.",
    initials: "MI",
    color: "#EF4444",
  },
];

export const FOOTER_LINKS = {
  Company: ["About Us", "Careers", "Press", "Blog"],
  Services: ["Refrigerator", "Washing Machine", "Microwave", "Oven"],
  Brands: ["Samsung", "LG", "IFB", "Bosch"],
  Support: ["Contact", "AMC Plans", "Track Service", "Help Center"],
  Legal: ["Privacy Policy", "Terms of Service", "Refund Policy", "Warranty"],
};
