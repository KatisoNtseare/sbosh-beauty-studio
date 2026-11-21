import mongoose, { Schema } from "mongoose";

const serviceSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
  description: { type: String, default: "", maxlength: 500 },
  fullDescription: { type: String, default: "", maxlength: 3000 },
  image: { type: String, default: "/images/hero.jpg" },
  imagePublicId: { type: String, default: "" },
  priceLabel: { type: String, default: "" },
  minimumPrice: { type: Number, min: 0 },
  maximumPrice: { type: Number, min: 0 },
  durationMinutes: { type: Number, min: 1 },
  category: { type: String, default: "Nail services", maxlength: 80 },
  displayOrder: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  archivedAt: Date,
}, { timestamps: true });

serviceSchema.index({ active: 1, displayOrder: 1, name: 1 });

export default mongoose.models.Service ?? mongoose.model("Service", serviceSchema);
