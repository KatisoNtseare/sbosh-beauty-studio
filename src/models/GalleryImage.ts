import mongoose, { Schema } from "mongoose";

const galleryImageSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  image: { type: String, required: true, maxlength: 1000 },
  imagePublicId: { type: String, required: true, maxlength: 100 },
  displayOrder: { type: Number, default: 0, min: 0, max: 10000 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

galleryImageSchema.index({ active: 1, displayOrder: 1, createdAt: -1 });
export default mongoose.models.GalleryImage ?? mongoose.model("GalleryImage", galleryImageSchema);
