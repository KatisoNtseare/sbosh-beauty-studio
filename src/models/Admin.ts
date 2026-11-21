import mongoose, { Schema } from "mongoose";

const adminSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  passwordSalt: { type: String, required: true, select: false },
  passwordHash: { type: String, required: true, select: false },
  active: { type: Boolean, default: true, index: true },
}, { timestamps: true });

export default mongoose.models.Admin ?? mongoose.model("Admin", adminSchema);
