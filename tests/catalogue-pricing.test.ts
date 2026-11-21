import { describe, expect, it } from "vitest";
import { calculateCatalogueTotal, calculateExtraLines, calculatePackagePrice } from "@/lib/catalogue-pricing";
import { buildServiceQuote, validatePackageFields } from "@/lib/catalogue";
import { validateServiceFields } from "@/lib/domain";
import { initialCataloguePackages, initialCatalogueServices } from "@/lib/catalogue-seed-data";

const extras = [
  { key: "nail-art", name: "Nail Art (Gems/Rhinestones)", unitPrice: 15, method: "PER_NAIL" as const },
  { key: "chrome", name: "Chrome", unitPrice: 20, method: "PER_NAIL" as const },
  { key: "3d-effect", name: "3D Effect", unitPrice: 30, method: "PER_DESIGN" as const },
  { key: "marble-effect", name: "Marble Effect", unitPrice: 10, method: "PER_DESIGN" as const },
];

describe("catalogue pricing", () => {
  it("contains all approved services and prices without inventing the pending prices", () => {
    expect(initialCatalogueServices.filter((service) => service.price !== undefined).map(({ name, price }) => [name, price])).toEqual([
      ["Plain Set", 150], ["Ombré Set", 170], ["French Set", 190], ["Plain Gel Set", 110], ["Gel French Set", 130],
      ["Plain Pedicure", 110], ["French Pedicure", 130], ["Plain Gel Pedicure", 100], ["Gel French Pedicure", 120], ["Buff N' Shine", 70],
    ]);
    expect(initialCatalogueServices.filter((service) => service.price === undefined).map((service) => service.name)).toEqual(["Acrylic Infills", "Acrylic Removal / Soak-Off", "Gel Removal", "Nail Repair"]);
    expect(initialCatalogueServices.every((service) => service.category !== "Setup placeholder")).toBe(true);
  });

  it("declares the approved five packages with component-derived prices", () => {
    const priceByName = new Map(initialCatalogueServices.map((service) => [service.name, service.price ?? null]));
    expect(initialCataloguePackages.map((item) => [item.name, calculatePackagePrice(item.serviceNames.map((name) => priceByName.get(name) ?? null))])).toEqual([
      ["Plain Acrylic + Plain Pedicure", 260], ["Ombré + Plain Pedicure", 280], ["French + French Pedicure", 320], ["Plain Gel + Plain Gel Pedicure", 210], ["Gel French + Gel French Pedicure", 250],
    ]);
  });

  it("calculates nail art and per-design extras at their configured units", () => {
    expect(calculateExtraLines(extras, [{ key: "nail-art", quantity: 2 }, { key: "3d-effect", quantity: 1 }])).toMatchObject([
      { name: "Nail Art (Gems/Rhinestones)", unitPrice: 15, method: "PER_NAIL", quantity: 2, subtotal: 30 },
      { name: "3D Effect", unitPrice: 30, method: "PER_DESIGN", quantity: 1, subtotal: 30 },
    ]);
    expect(calculateExtraLines(extras, [{ key: "chrome", quantity: 3 }])[0].subtotal).toBe(60);
    expect(calculateExtraLines(extras, [{ key: "marble-effect", quantity: 2 }])[0].subtotal).toBe(20);
  });

  it("derives server quotes and ignores browser-supplied totals", () => {
    const quote = buildServiceQuote({ _id: "507f1f77bcf86cd799439011", name: "French Set", price: 190, priceConfirmed: true, extras, active: true }, [{ key: "nail-art", quantity: 2 }, { key: "3d-effect", quantity: 1 }]);
    expect(quote.totalPrice).toBe(250);
    expect(quote).not.toHaveProperty("durationMinutes");
    expect(calculateCatalogueTotal(quote.service.price ?? null, quote.extras.map((extra) => extra.subtotal))).toBe(250);
  });

  it("rejects unconfigured, incompatible, duplicate and invalid quantity selections", () => {
    expect(() => calculateExtraLines(extras, [{ key: "chrome", quantity: 0 }])).toThrow();
    expect(() => calculateExtraLines(extras, [{ key: "chrome", quantity: 11 }])).toThrow();
    expect(() => calculateExtraLines(extras, [{ key: "unavailable", quantity: 1 }])).toThrow();
    expect(() => calculateExtraLines(extras, [{ key: "chrome", quantity: 1 }, { key: "chrome", quantity: 2 }])).toThrow();
    expect(buildServiceQuote({ _id: "507f1f77bcf86cd799439011", name: "Buff N' Shine", price: 70, priceConfirmed: true, extras: [], active: true }, []).totalPrice).toBe(70);
  });

  it("keeps unconfirmed catalogue prices explicit and out of totals", () => {
    const service = validateServiceFields({ name: "Nail Repair", category: "Additional Services", durationMinutes: 45, priceConfirmed: false });
    expect(service).toMatchObject({ priceConfirmed: false });
    expect(service).not.toHaveProperty("durationMinutes");
    const quote = buildServiceQuote({ _id: "507f1f77bcf86cd799439011", name: "Nail Repair", active: true }, []);
    expect(quote.totalPrice).toBeNull();
    expect(quote.priceNeedsConfirmation).toBe(true);
    expect(validateServiceFields({ name: "Nail Repair", priceConfirmed: true })).toBeNull();
  });

  it("calculates package values as exact combined prices without a discount", () => {
    expect(calculatePackagePrice([150, 110])).toBe(260);
    expect(calculatePackagePrice([170, 110])).toBe(280);
    expect(calculatePackagePrice([190, 130])).toBe(320);
    expect(calculatePackagePrice([110, 100])).toBe(210);
    expect(calculatePackagePrice([130, 120])).toBe(250);
    expect(calculatePackagePrice([null, 100])).toBeNull();
  });

  it("validates package composition, distinct services, and no price override", () => {
    expect(validatePackageFields({ name: "French pair", serviceIds: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"], additionalDurationMinutes: 60 })).toMatchObject({ serviceIds: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"] });
    expect(validatePackageFields({ name: "French pair", serviceIds: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"] })).not.toHaveProperty("additionalDurationMinutes");
    expect(validatePackageFields({ name: "Bad pair", serviceIds: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439011"] })).toBeNull();
  });
});
