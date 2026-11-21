import mongoose, { Schema } from "mongoose";

const extraSchema = new Schema({
  key: { type: String, required: true, trim: true, maxlength: 80 },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  unitPrice: { type: Number, required: true, min: 1 },
  method: { type: String, enum: ["PER_NAIL", "PER_DESIGN"], required: true },
  durationMinutes: { type: Number, min: 0, max: 240, select: false },
}, { _id: false });

const serviceSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
  description: { type: String, default: "", maxlength: 500 },
  fullDescription: { type: String, default: "", maxlength: 3000 },
  image: { type: String, default: "/images/hero.jpg" },
  imagePublicId: { type: String, default: "" },
  priceLabel: { type: String, default: "" },
  price: { type: Number, min: 1 },
  priceConfirmed: { type: Boolean, default: false },
  minimumPrice: { type: Number, min: 0 },
  maximumPrice: { type: Number, min: 0 },
  classification: { type: String, enum: ["LASHES", "NAILS", "TOES", "GENERAL"], default: "GENERAL" },
  durationMinutes: { type: Number, min: 1, max: 720, select: false },
  durationConfirmed: { type: Boolean, select: false },
  extras: { type: [extraSchema], default: [] },
  category: { type: String, default: "Nail services", maxlength: 80 },
  displayOrder: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  archivedAt: Date,
}, { timestamps: true });

serviceSchema.index({ active: 1, displayOrder: 1, name: 1 });
export default mongoose.models.Service ?? mongoose.model("Service", serviceSchema);
