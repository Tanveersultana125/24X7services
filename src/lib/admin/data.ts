
export type BookingStatus = "new" | "assigned" | "in-progress" | "completed" | "cancelled";

export type Booking = {
  id: string;
  customer: string;
  phone: string;
  appliance: string;
  problem: string;
  city: string;
  date: string;
  price: number;
  status: BookingStatus;
  tech?: string;
};

export const BOOKINGS: Booking[] = [
  { id: "BK-2041", customer: "Ananya Rao", phone: "98450 11223", appliance: "Refrigerator", problem: "Not Cooling", city: "Hyderabad", date: "2026-07-18", price: 799, status: "new" },
  { id: "BK-2040", customer: "Rahul Mehta", phone: "99001 44556", appliance: "Washing Machine", problem: "Drum Issue", city: "Karimnagar", date: "2026-07-18", price: 1299, status: "assigned", tech: "Ravi K." },
  { id: "BK-2039", customer: "Sneha Iyer", phone: "90080 77112", appliance: "Microwave", problem: "Not Heating", city: "Nizamabad", date: "2026-07-17", price: 599, status: "in-progress", tech: "Imran S." },
  { id: "BK-2038", customer: "Vikram Singh", phone: "70420 33445", appliance: "AC", problem: "Gas Refill", city: "Secunderabad", date: "2026-07-17", price: 1499, status: "completed", tech: "Ravi K." },
  { id: "BK-2037", customer: "Priya Nair", phone: "88790 55667", appliance: "Refrigerator", problem: "Water Leakage", city: "Khammam", date: "2026-07-16", price: 499, status: "completed", tech: "Deepak M." },
  { id: "BK-2036", customer: "Arjun Das", phone: "97410 99887", appliance: "Microwave & Oven", problem: "Thermostat", city: "Hyderabad", date: "2026-07-16", price: 1199, status: "cancelled" },
  { id: "BK-2035", customer: "Meera Joshi", phone: "96320 12121", appliance: "Washing Machine", problem: "Not Starting", city: "Warangal", date: "2026-07-15", price: 699, status: "completed", tech: "Imran S." },
  { id: "BK-2034", customer: "Karan Malhotra", phone: "90000 65432", appliance: "AC", problem: "Deep Clean", city: "Ramagundam", date: "2026-07-15", price: 599, status: "completed", tech: "Deepak M." },
];

export const TECHNICIANS = ["Ravi K.", "Imran S.", "Deepak M.", "Sunil P."];

// Services are real data now — see `src/lib/catalogue.ts` for the Firestore
// layer and `catalogue-shared.ts` for how a saved change is merged with what
// ships in `data.ts`.

// Reviews are real data now — see `src/lib/reviews.ts` for the Firestore layer.

export type GalleryItem = { id: string; src: string; label: string; category: string };

export const GALLERY: GalleryItem[] = [
  { id: "G1", src: "/work/gallery/ac-1.png", label: "AC service", category: "AC" },
  { id: "G2", src: "/work/gallery/ac-2.png", label: "Split-AC deep clean", category: "AC" },
  { id: "G3", src: "/work/gallery/ac-3.png", label: "AC installation", category: "AC" },
  { id: "G4", src: "/work/gallery/fridge-1.png", label: "Refrigerator repair", category: "Refrigerator" },
  { id: "G5", src: "/work/gallery/fridge-2.png", label: "Cooling repair", category: "Refrigerator" },
  { id: "G6", src: "/work/gallery/washing-1.png", label: "Washing machine repair", category: "Washing Machine" },
  { id: "G7", src: "/work/gallery/washing-2.png", label: "Front-load service", category: "Washing Machine" },
  { id: "G8", src: "/work/gallery/microwave-1.png", label: "Microwave repair", category: "Microwave" },
  { id: "G9", src: "/work/gallery/microwave-2.png", label: "Microwave diagnosis", category: "Microwave" },
];

export const STATUS_META: Record<BookingStatus, { label: string; color: string }> = {
  new: { label: "New", color: "#2547d0" },
  assigned: { label: "Assigned", color: "#d9821b" },
  "in-progress": { label: "In progress", color: "#7c3aed" },
  completed: { label: "Completed", color: "#0b9a63" },
  cancelled: { label: "Cancelled", color: "#dc2626" },
};
