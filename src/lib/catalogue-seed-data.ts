import type { CatalogueExtra } from "@/lib/catalogue-pricing";

const nailExtras: CatalogueExtra[] = [
  { key: "nail-art", name: "Nail Art (Gems/Rhinestones)", unitPrice: 15, method: "PER_NAIL" },
  { key: "chrome", name: "Chrome", unitPrice: 20, method: "PER_NAIL" },
  { key: "3d-effect", name: "3D Effect", unitPrice: 30, method: "PER_DESIGN" },
  { key: "marble-effect", name: "Marble Effect", unitPrice: 10, method: "PER_DESIGN" },
];

type SeedService = { name: string; category: string; price?: number; description: string; extras: CatalogueExtra[] };
export const initialCatalogueServices: SeedService[] = [
  { name: "Plain Set", category: "Acrylic Nail Sets", price: 150, description: "A neat acrylic set with a clean, classic finish.", extras: nailExtras },
  { name: "Ombré Set", category: "Acrylic Nail Sets", price: 170, description: "A soft fade of colour shaped into an acrylic set.", extras: nailExtras },
  { name: "French Set", category: "Acrylic Nail Sets", price: 190, description: "A timeless French finish over a sculpted acrylic set.", extras: nailExtras },
  { name: "Plain Gel Set", category: "Gel Nail Sets", price: 110, description: "A smooth gel finish in a colour of your choice.", extras: nailExtras },
  { name: "Gel French Set", category: "Gel Nail Sets", price: 130, description: "A crisp French finish with gel polish.", extras: nailExtras },
  { name: "Plain Pedicure", category: "Pedicures", price: 110, description: "A considered pedicure with a simple, polished finish.", extras: nailExtras },
  { name: "French Pedicure", category: "Pedicures", price: 130, description: "A French finish for a freshly cared-for look.", extras: nailExtras },
  { name: "Plain Gel Pedicure", category: "Pedicures", price: 100, description: "Gel colour with a smooth, lasting finish.", extras: nailExtras },
  { name: "Gel French Pedicure", category: "Pedicures", price: 120, description: "A clean French pedicure finished with gel.", extras: nailExtras },
  { name: "Buff N' Shine", category: "Nail Care", price: 70, description: "Natural nails shaped, buffed and brought to a healthy shine.", extras: [] as CatalogueExtra[] },
  { name: "Acrylic Infills", category: "Additional Services", description: "Refresh and rebalance existing acrylic enhancements.", extras: nailExtras },
  { name: "Acrylic Removal / Soak-Off", category: "Additional Services", description: "Careful removal of acrylic product.", extras: [] as CatalogueExtra[] },
  { name: "Gel Removal", category: "Additional Services", description: "Careful removal of gel polish.", extras: [] as CatalogueExtra[] },
  { name: "Nail Repair", category: "Additional Services", description: "A repair for a broken or chipped nail.", extras: nailExtras },
];

export const initialCataloguePackages = [
  { name: "Plain Acrylic + Plain Pedicure", serviceNames: ["Plain Set", "Plain Pedicure"] },
  { name: "Ombré + Plain Pedicure", serviceNames: ["Ombré Set", "Plain Pedicure"] },
  { name: "French + French Pedicure", serviceNames: ["French Set", "French Pedicure"] },
  { name: "Plain Gel + Plain Gel Pedicure", serviceNames: ["Plain Gel Set", "Plain Gel Pedicure"] },
  { name: "Gel French + Gel French Pedicure", serviceNames: ["Gel French Set", "Gel French Pedicure"] },
];
