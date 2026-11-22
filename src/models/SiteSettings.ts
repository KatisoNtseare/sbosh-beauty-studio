import mongoose, { Schema } from "mongoose";
import { businessProfile } from "@/lib/brand";

const siteSettingsSchema = new Schema({
  key: { type: String, required: true, unique: true, default: "main" },
  phoneNumber: { type: String, required: true, default: "27813179144", maxlength: 15 },
  whatsappNumber: { type: String, required: true, default: "27813179144", maxlength: 15 },
  email: { type: String, required: true, default: "info@sboshsbeautystudio.co.za", lowercase: true, trim: true, maxlength: 254 },
  address: { type: String, required: true, default: businessProfile.contact.address, trim: true, maxlength: 240 },
  mapHref: { type: String, required: true, default: businessProfile.contact.mapHref, trim: true, maxlength: 2048 },
}, { timestamps: true });

export default mongoose.models.SiteSettings ?? mongoose.model("SiteSettings", siteSettingsSchema);
