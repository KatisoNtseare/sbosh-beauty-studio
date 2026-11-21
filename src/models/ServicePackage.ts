import mongoose, { Schema } from "mongoose";

const servicePackageSchema = new Schema({
  name: { type: String, required: true, trim: true, unique: true, maxlength: 120 },
  description: { type: String, default: "", maxlength: 1000 },
  image: { type: String, default: "/images/hero.jpg" },
  serviceIds: { type: [Schema.Types.ObjectId], ref: "Service", required: true, validate: (ids: unknown[]) => ids.length >= 2 },
  additionalDurationMinutes: { type: Number, min: 0, max: 240, select: false },
  displayOrder: { type: Number, default: 0, min: 0, max: 10_000 },
  active: { type: Boolean, default: true },
  archivedAt: Date,
}, { timestamps: true });

servicePackageSchema.index({ active: 1, displayOrder: 1, name: 1 });
export default mongoose.models.ServicePackage ?? mongoose.model("ServicePackage", servicePackageSchema);
