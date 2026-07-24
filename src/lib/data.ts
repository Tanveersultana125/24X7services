import type { Appliance, AmcPlan, Brand } from "./types";

export const BRANDS: Brand[] = [
  { id: "samsung", name: "Samsung", tagline: "Authorised repair & genuine parts", accent: "#1428A0" },
  { id: "lg", name: "LG", tagline: "Certified LG appliance specialists", accent: "#A50034" },
  { id: "ifb", name: "IFB", tagline: "Expert front-load & modular care", accent: "#005EB8" },
  { id: "bosch", name: "Bosch", tagline: "Precision German-engineered service", accent: "#EA0016" },
];

export const APPLIANCES: Appliance[] = [
  {
    id: "refrigerator",
    name: "Refrigerator",
    blurb: "Cooling, gas, compressor & installation by certified pros.",
    startingPrice: 299,
    serviceTime: "45–90 min",
    rating: 4.9,
    bookings: "1.2M+",
    problems: [
      { id: "not-cooling", label: "Not Cooling", price: [499, 1499], eta: "60 min", common: true },
      { id: "water-leakage", label: "Water Leakage", price: [399, 899], eta: "45 min", common: true },
      { id: "gas-filling", label: "Gas Filling", price: [1499, 2999], eta: "90 min" },
      { id: "door-issue", label: "Door Issue", price: [299, 799], eta: "40 min" },
      { id: "compressor", label: "Compressor", price: [2499, 5999], eta: "120 min" },
      { id: "ice-build-up", label: "Ice Build-up", price: [399, 999], eta: "50 min" },
      { id: "noise", label: "Noise / Vibration", price: [299, 699], eta: "40 min" },
      { id: "installation", label: "Installation", price: [499, 999], eta: "45 min" },
    ],
  },
  {
    id: "washing-machine",
    name: "Washing Machine",
    blurb: "Front-load & top-load repair, drum, motor & spin fixes.",
    startingPrice: 249,
    serviceTime: "40–80 min",
    rating: 4.8,
    bookings: "980K+",
    problems: [
      { id: "not-starting", label: "Not Starting", price: [399, 1299], eta: "50 min", common: true },
      { id: "motor-problem", label: "Motor Problem", price: [1499, 3499], eta: "90 min" },
      { id: "water-leakage", label: "Water Leakage", price: [399, 999], eta: "45 min", common: true },
      { id: "drum-issue", label: "Drum Issue", price: [899, 2499], eta: "80 min" },
      { id: "spin-issue", label: "Spin Issue", price: [499, 1299], eta: "60 min" },
      { id: "noise", label: "Noise / Vibration", price: [299, 799], eta: "40 min" },
      { id: "installation", label: "Installation", price: [399, 799], eta: "45 min" },
    ],
  },
  {
    id: "microwave",
    name: "Microwave & Oven",
    blurb: "Magnetron, heating, thermostat, fan & smart-panel repair for microwaves and ovens.",
    startingPrice: 199,
    serviceTime: "30–75 min",
    rating: 4.8,
    bookings: "1.05M+",
    problems: [
      { id: "not-heating", label: "Not Heating", price: [499, 1799], eta: "60 min", common: true },
      { id: "spark", label: "Sparking", price: [399, 999], eta: "45 min", common: true },
      { id: "thermostat", label: "Thermostat", price: [699, 1899], eta: "70 min", common: true },
      { id: "plate-not-rotating", label: "Plate Not Rotating", price: [299, 699], eta: "40 min" },
      { id: "fan-issue", label: "Fan Issue", price: [499, 1499], eta: "60 min" },
      { id: "display-issue", label: "Display Issue", price: [499, 1299], eta: "50 min" },
      { id: "door-lock", label: "Door Lock", price: [299, 799], eta: "40 min" },
      { id: "power-problem", label: "Power Problem", price: [399, 1199], eta: "50 min" },
      { id: "installation", label: "Installation", price: [299, 899], eta: "40 min" },
    ],
  },
  {
    id: "ac",
    name: "Air Conditioner",
    blurb: "Cooling loss, gas charging, deep-clean & installation for split and window units.",
    startingPrice: 499,
    serviceTime: "45–120 min",
    rating: 4.9,
    bookings: "890K+",
    problems: [
      { id: "not-cooling", label: "Not Cooling", price: [599, 1999], eta: "60 min", common: true },
      { id: "gas-filling", label: "Gas Charging", price: [1999, 3999], eta: "90 min", common: true },
      { id: "deep-clean", label: "Foam-jet Deep Clean", price: [699, 1299], eta: "60 min" },
      { id: "water-leakage", label: "Water Leakage", price: [499, 1199], eta: "50 min" },
      { id: "noise", label: "Noise / Vibration", price: [399, 999], eta: "45 min" },
      { id: "pcb-issue", label: "PCB / Remote Fault", price: [999, 2999], eta: "70 min" },
      { id: "installation", label: "Installation", price: [1499, 2499], eta: "120 min" },
      { id: "uninstallation", label: "Uninstallation", price: [699, 999], eta: "60 min" },
    ],
  },
];

export const AMC_PLANS: AmcPlan[] = [
  {
    id: "essential",
    name: "Essential",
    price: 1499,
    period: "/ year",
    perks: [
      "2 preventive maintenance visits",
      "Priority same-day support",
      "10% off on all repairs",
      "Free diagnosis, always",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 2999,
    period: "/ year",
    highlight: true,
    perks: [
      "4 preventive maintenance visits",
      "Unlimited repair labour",
      "Genuine spare parts included",
      "Predictive maintenance alerts",
      "Dedicated relationship manager",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: 6999,
    period: "/ year",
    perks: [
      "Up to 8 appliances covered",
      "Monthly health checks",
      "4-hour emergency SLA",
      "On-site spare inventory",
      "Consolidated GST invoicing",
    ],
  },
];

export const TIME_SLOTS = [
  "08:00 – 10:00",
  "10:00 – 12:00",
  "12:00 – 02:00",
  "02:00 – 04:00",
  "04:00 – 06:00",
  "06:00 – 08:00",
];

export const PAYMENT_METHODS = [
  { id: "upi", label: "UPI", hint: "GPay · PhonePe · Paytm", instant: true },
  { id: "razorpay", label: "Razorpay", hint: "Cards · Wallets · Net Banking", instant: true },
  { id: "stripe", label: "Stripe", hint: "International cards", instant: true },
  { id: "credit-card", label: "Credit Card", hint: "Visa · Mastercard · Amex", instant: true },
  { id: "debit-card", label: "Debit Card", hint: "All major banks", instant: true },
  { id: "net-banking", label: "Net Banking", hint: "60+ banks supported", instant: false },
  { id: "cod", label: "Cash After Service", hint: "Pay once the job is done", instant: false },
];

export function getAppliance(id?: string) {
  return APPLIANCES.find((a) => a.id === id);
}

/** Display name for a chosen appliance, resolving the free-text "other" case. */
export function applianceLabel(draft: { appliance?: string; otherAppliance?: string }) {
  if (!draft.appliance) return undefined;
  if (draft.appliance === "other") return draft.otherAppliance?.trim() || "Other appliance";
  return getAppliance(draft.appliance)?.name;
}

export function getBrand(id?: string) {
  return BRANDS.find((b) => b.id === id);
}

/** Display name for a chosen brand, resolving the free-text "other" case. */
export function brandLabel(draft: { brand?: string; otherBrand?: string }) {
  if (!draft.brand) return undefined;
  if (draft.brand === "other") return draft.otherBrand?.trim() || "Other brand";
  return getBrand(draft.brand)?.name;
}
