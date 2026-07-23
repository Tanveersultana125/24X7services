import { APPLIANCES } from "@/lib/data";

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
  { id: "BK-2036", customer: "Arjun Das", phone: "97410 99887", appliance: "Oven", problem: "Thermostat", city: "Hyderabad", date: "2026-07-16", price: 1199, status: "cancelled" },
  { id: "BK-2035", customer: "Meera Joshi", phone: "96320 12121", appliance: "Washing Machine", problem: "Not Starting", city: "Warangal", date: "2026-07-15", price: 699, status: "completed", tech: "Imran S." },
  { id: "BK-2034", customer: "Karan Malhotra", phone: "90000 65432", appliance: "AC", problem: "Deep Clean", city: "Ramagundam", date: "2026-07-15", price: 599, status: "completed", tech: "Deepak M." },
];

export const TECHNICIANS = ["Ravi K.", "Imran S.", "Deepak M.", "Sunil P."];

export type AdminService = {
  id: string;
  name: string;
  startingPrice: number;
  serviceTime: string;
  rating: number;
  bookings: string;
  active: boolean;
};

export const SERVICES: AdminService[] = APPLIANCES.map((a) => ({
  id: a.id,
  name: a.name,
  startingPrice: a.startingPrice,
  serviceTime: a.serviceTime,
  rating: a.rating,
  bookings: a.bookings,
  active: true,
}));

export type AdminReview = {
  id: string;
  name: string;
  city: string;
  rating: number;
  text: string;
  appliance: string;
  date: string;
  status: "published" | "pending";
};

export const REVIEWS: AdminReview[] = [
  { id: "RV-118", name: "Ananya Rao", city: "Hyderabad", rating: 5, text: "Technician arrived in 40 minutes and fixed the cooling issue same day. Genuine parts, clean work.", appliance: "Refrigerator", date: "2026-07-18", status: "published" },
  { id: "RV-117", name: "Rahul Mehta", city: "Karimnagar", rating: 5, text: "Booked a washing machine repair at night, done by next morning. Loved the live tracking.", appliance: "Washing Machine", date: "2026-07-17", status: "published" },
  { id: "RV-116", name: "Sneha Iyer", city: "Nizamabad", rating: 4, text: "Good service, slightly delayed but the microwave works perfectly now.", appliance: "Microwave", date: "2026-07-16", status: "pending" },
  { id: "RV-115", name: "Vikram Singh", city: "Secunderabad", rating: 5, text: "Foam-jet AC service was thorough. Cooling improved a lot.", appliance: "AC", date: "2026-07-15", status: "published" },
  { id: "RV-114", name: "Arjun Das", city: "Hyderabad", rating: 3, text: "Oven fixed but had to follow up once. Support was responsive.", appliance: "Oven", date: "2026-07-14", status: "pending" },
];

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
