import { connectDb } from "@/lib/mongodb";
import { businessProfile } from "@/lib/brand";
import SiteSettings from "@/models/SiteSettings";

export type SiteSettingValues = { phoneNumber: string; whatsappNumber: string; email: string };
const defaults: SiteSettingValues = {
  phoneNumber: businessProfile.contact.internationalPhone,
  whatsappNumber: businessProfile.contact.whatsappNumber,
  email: businessProfile.contact.email,
};

function digits(value: string) {
  const clean = value.replace(/\D/g, "");
  return clean.startsWith("0") ? `27${clean.slice(1)}` : clean;
}

export async function getSiteSettings(): Promise<SiteSettingValues> {
  try {
    await connectDb();
    const saved = await SiteSettings.findOne({ key: "main" }).select("phoneNumber whatsappNumber email").lean();
    return saved ? {
      phoneNumber: digits(String(saved.phoneNumber || defaults.phoneNumber)),
      whatsappNumber: digits(String(saved.whatsappNumber || defaults.whatsappNumber)),
      email: String(saved.email || defaults.email).trim().toLowerCase(),
    } : defaults;
  } catch {
    return defaults;
  }
}

function phoneDisplay(value: string) {
  if (value.length === 11 && value.startsWith("27")) return `+27 ${value.slice(2, 4)} ${value.slice(4, 7)} ${value.slice(7)}`;
  return `+${value}`;
}

export async function getStudioContact() {
  const settings = await getSiteSettings();
  return {
    ...businessProfile.contact,
    phone: phoneDisplay(settings.phoneNumber),
    phoneHref: `tel:+${settings.phoneNumber}`,
    internationalPhone: settings.phoneNumber,
    whatsappNumber: settings.whatsappNumber,
    whatsappHref: `https://wa.me/${settings.whatsappNumber}`,
    email: settings.email,
    emailHref: `mailto:${settings.email}`,
  };
}

export function normalizeContactNumber(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = digits(value.trim());
  return normalized.length >= 9 && normalized.length <= 15 ? normalized : null;
}

export function validContactEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
