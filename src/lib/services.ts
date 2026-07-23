import type { ApplianceId } from "./types";

export interface Service {
  no: string;
  id: string;
  title: string;
  kind: "repair" | "care";
  appliance?: ApplianceId;
  desc: string;
  price: string;
  eta: string;
  tags: string[];
  /** Background photo for the service preview card. */
  image: string;
  /** object-position for that photo — each shot frames its subject differently. */
  imagePos: string;
}

/** The eight premium services, presented as an editorial index. */
export const SERVICES: Service[] = [
  {
    no: "01", id: "refrigerator", title: "Refrigerator Repair", kind: "repair", appliance: "refrigerator",
    desc: "Cooling loss, gas top-up, compressor & leak diagnosis — restored to factory-cold.",
    price: "from ₹299", eta: "45–90 min", tags: ["Cooling", "Compressor", "Gas"], image: "/work/gallery/fridge-1.png", imagePos: "center 20%",
  },
  {
    no: "02", id: "washing-machine", title: "Washing Machine Repair", kind: "repair", appliance: "washing-machine",
    desc: "Front & top-load drums, motors, spin and leak faults handled by specialists.",
    price: "from ₹249", eta: "40–80 min", tags: ["Motor", "Drum", "Spin"], image: "/work/gallery/washing-1.png", imagePos: "center 20%",
  },
  {
    no: "03", id: "microwave", title: "Microwave Repair", kind: "repair", appliance: "microwave",
    desc: "Magnetron, heating, sparking and display faults — precise, tested, safe.",
    price: "from ₹199", eta: "30–60 min", tags: ["Heating", "Magnetron", "Display"], image: "/work/gallery/microwave-1.png", imagePos: "center 30%",
  },
  {
    no: "04", id: "oven", title: "Oven Repair", kind: "repair", appliance: "oven",
    desc: "Heating elements, thermostats, fans and smart panels calibrated to perfection.",
    price: "from ₹249", eta: "40–75 min", tags: ["Thermostat", "Element", "Fan"], image: "/work/gallery/microwave-2.png", imagePos: "60% 42%",
  },
  {
    no: "05", id: "installation", title: "Installation", kind: "care",
    desc: "White-glove setup, levelling, testing and a walkthrough — done once, done right.",
    price: "from ₹399", eta: "45 min", tags: ["Setup", "Levelling", "Demo"], image: "/work/ac-hero.png", imagePos: "center 22%",
  },
  {
    no: "06", id: "uninstallation", title: "Uninstallation", kind: "care",
    desc: "Safe disconnection, draining and packing for a move — zero damage, guaranteed.",
    price: "from ₹299", eta: "40 min", tags: ["Disconnect", "Drain", "Pack"], image: "/work/gallery/ac-2.png", imagePos: "center 30%",
  },
  {
    no: "07", id: "amc", title: "Annual Maintenance", kind: "care",
    desc: "Scheduled health checks and priority care that quietly keep everything running.",
    price: "from ₹1,499/yr", eta: "Ongoing", tags: ["Preventive", "Priority", "Genuine"], image: "/work/family-ac.png", imagePos: "center 35%",
  },
  {
    no: "08", id: "emergency", title: "Emergency Repair", kind: "care",
    desc: "A certified expert dispatched with priority — any appliance, any hour, 24×7.",
    price: "express +₹199", eta: "< 90 min", tags: ["Priority", "24×7", "Rapid"], image: "/work/ac-outdoor-service.png", imagePos: "center 25%",
  },
];
