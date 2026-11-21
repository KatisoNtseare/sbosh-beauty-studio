export type CartEntry = {
  id: string;
  kind: "service" | "package";
  extras: Record<string, number>;
};

export const cartStorageKey = "sbosh-studio-cart";

let cachedRaw = "";
let cachedEntries: CartEntry[] = [];

function parseCart(raw: string): CartEntry[] {
  try {
    const parsed: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is CartEntry => Boolean(entry && typeof entry === "object" && typeof entry.id === "string" && ["service", "package"].includes(entry.kind) && entry.extras && typeof entry.extras === "object"));
  } catch { return []; }
}

export function readCart(): CartEntry[] {
  return parseCart(window.localStorage.getItem(cartStorageKey) || "[]");
}

export function subscribeCart(callback: () => void) {
  window.addEventListener("sbosh-cart-updated", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("sbosh-cart-updated", callback);
    window.removeEventListener("storage", callback);
  };
}

export function getCartSnapshot() {
  const raw = window.localStorage.getItem(cartStorageKey) || "[]";
  if (raw !== cachedRaw) { cachedRaw = raw; cachedEntries = parseCart(raw); }
  return cachedEntries;
}

export function getServerCartSnapshot() {
  return [] as CartEntry[];
}

export function saveCart(entries: CartEntry[]) {
  const raw = JSON.stringify(entries);
  window.localStorage.setItem(cartStorageKey, raw);
  cachedRaw = raw;
  cachedEntries = entries;
  window.dispatchEvent(new CustomEvent("sbosh-cart-updated", { detail: entries }));
}

export function addCartEntry(entry: Pick<CartEntry, "id" | "kind">) {
  const current = readCart();
  if (current.some((item) => item.id === entry.id && item.kind === entry.kind)) return { entries: current, added: false };
  const entries = [...current, { ...entry, extras: {} }];
  saveCart(entries);
  return { entries, added: true };
}
