import mongoose, { Schema } from "mongoose";

const rateLimitSchema = new Schema({
  _id: { type: String, required: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
}, { versionKey: false });

rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.models.RateLimit ?? mongoose.model("RateLimit", rateLimitSchema, "rate_limits");
