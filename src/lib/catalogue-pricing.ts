export type ExtraMethod = "PER_NAIL" | "PER_DESIGN";
export type CatalogueExtra = { key: string; name: string; unitPrice: number; method: ExtraMethod; durationMinutes?: number };
export type ExtraSelection = { key: string; quantity: number };

export function calculateExtraLines(extras: CatalogueExtra[], selections: ExtraSelection[]) {
  if (!Array.isArray(selections)) throw new Error("Choose valid extras.");
  const seen = new Set<string>();
  return selections.map((selection) => {
    if (!selection || typeof selection.key !== "string" || seen.has(selection.key)) throw new Error("An extra selection is invalid.");
    seen.add(selection.key);
    const extra = extras.find((item) => item.key === selection.key);
    if (!extra || !Number.isInteger(selection.quantity) || selection.quantity < 1 || selection.quantity > 10) throw new Error("Choose a valid extra quantity.");
    return { key: extra.key, name: extra.name, method: extra.method, unitPrice: extra.unitPrice, quantity: selection.quantity, subtotal: extra.unitPrice * selection.quantity, durationMinutes: extra.durationMinutes ?? 0 };
  });
}

export function calculateCatalogueTotal(basePrice: number | null, extraSubtotals: number[]) {
  return basePrice == null ? null : basePrice + extraSubtotals.reduce((sum, value) => sum + value, 0);
}

export function calculatePackagePrice(prices: Array<number | null>) {
  return prices.some((price) => price == null) ? null : prices.reduce<number>((sum, price) => sum + (price ?? 0), 0);
}
