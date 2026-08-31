/**
 * The four that ship with the build, plus "other" — and any id an admin coins
 * by adding a company of their own. The union is kept for autocomplete; the
 * `string & {}` arm is what lets a new make exist without a code change.
 */
export type BrandId =
  | "samsung"
  | "lg"
  | "ifb"
  | "bosch"
  | "other"
  | (string & NonNullable<unknown>);

/** Sentinel problem id used when the customer types their own issue. */
export const OTHER_PROBLEM_ID = "other";

/**
 * The four that ship with the build, plus "other" — and any id an admin coins
 * by adding a service of their own. The union is kept for autocomplete; the
 * `string & {}` arm is what lets a new service exist without a code change.
 */
export type ApplianceId =
  | "refrigerator"
  | "washing-machine"
  | "microwave"
  | "ac"
  | "other"
  | (string & NonNullable<unknown>);

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
  /**
   * The kinds this appliance comes in — front load and top load, split and
   * window. It decides what the technician packs and how long the job takes,
   * and it is not something anybody can tell from the word "washing machine".
   * Absent means the appliance has no meaningful kinds and none is asked for.
   */
  variants?: string[];
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

/**
 * One appliance the visit is for, and what is wrong with it.
 *
 * A visit can cover more than one: two air conditioners and the fridge is one
 * technician at one address, not three bookings. The first three steps of the
 * form fill in one of these at a time.
 */
export interface BookingJob {
  brand?: BrandId;
  /** Free-text brand name when `brand === "other"`. */
  otherBrand?: string;
  appliance?: ApplianceId;
  /** Free-text appliance name when `appliance === "other"`. */
  otherAppliance?: string;
  /** Which kind of it — front load, split, double door. */
  variant?: string;
  /**
   * How many of that appliance — two air conditioners in the same flat is one
   * job, not two. Absent reads as one, so a draft made before this existed
   * still means what it meant.
   */
  units?: number;
  problems: string[];
  /** Free-text problem description when `problems` includes `OTHER_PROBLEM_ID`. */
  otherProblem?: string;
}

export interface BookingDraft extends BookingJob {
  /**
   * The appliances already added to this visit. The job being filled in lives
   * in the fields above rather than at the end of this list, so the three
   * steps that build it never have to know how many came before.
   */
  more?: BookingJob[];
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
