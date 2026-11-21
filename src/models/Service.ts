import mongoose, { Schema } from "mongoose";

const serviceSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: "", maxlength: 500 },
  image: { type: String, default: "/images/hero.jpg" },
  priceLabel: { type: String, default: "" },
  durationMinutes: { type: Number, min: 1 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Service ?? mongoose.model("Service", serviceSchema);
