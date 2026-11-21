export const CURRENCY = "$"; // change to "R" if you want rand

export type Treatment = { name: string; price?: number };
export type ServiceGroup = { id: string; title: string; treatments: Treatment[] };

export const serviceGroups: ServiceGroup[] = [
  {
    id: "facials",
    title: "Facials & Skin Care",
    treatments: [
      { name: "Custom Facial", price: 120 },
      { name: "HydraFacial", price: 250 },
    ],
  },
  {
    id: "brows-lashes",
    title: "Brows & Lashes",
    treatments: [
      { name: "Brow Lamination", price: 85 },
      { name: "Lash Lift", price: 95 },
    ],
  },
  {
    id: "nails",
    title: "Nail Services",
    treatments: [
      { name: "Manicure", price: 65 },
      { name: "Pedicure", price: 75 },
    ],
  },
  {
    id: "massage",
    title: "Massage Therapy",
    treatments: [{ name: "Deep Tissue Massage", price: 140 }],
  },
  {
    id: "makeup",
    title: "Makeup & Beauty",
    treatments: [{ name: "Event Makeup" }, { name: "Consultations" }],
  },
];

export const pricedTreatments = serviceGroups.flatMap((g) =>
  g.treatments.filter((t) => t.price !== undefined)
);

// Placeholder times. Replace with the studio's real hours.
export const timeSlots = [
  "09:00", "10:00", "11:00", "12:30", "14:00", "15:30", "16:30",
];