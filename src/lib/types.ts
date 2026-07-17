export type BrandId = "samsung" | "lg" | "ifb" | "bosch";

export type ApplianceId = "refrigerator" | "washing-machine" | "microwave" | "oven";

export interface Brand {
  id: BrandId;
  name: string;
  tagline: string;
  /** Signature brand accent for subtle theming. */
  accent: string;
}

export interface Problem {
  id: string;
  label: string;
  /** Rough repair price band in INR. */
  price: [number, number];
  /** Typical resolution time. */
  eta: string;
  common?: boolean;
}

export interface Appliance {
  id: ApplianceId;
  name: string;
  blurb: string;
  startingPrice: number;
  serviceTime: string;
  rating: number;
  bookings: string;
  problems: Problem[];
}

export interface AmcPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  highlight?: boolean;
  perks: string[];
}

export type BookingStepId =
  | "brand"
  | "appliance"
  | "problem"
  | "date"
  | "time"
  | "address"
  | "payment"
  | "confirmed";

export interface BookingDraft {
  brand?: BrandId;
  appliance?: ApplianceId;
  problems: string[];
  date?: string;
  slot?: string;
  address?: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    pincode: string;
    landmark?: string;
  };
  payment?: string;
}
