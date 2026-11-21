import mongoose, { Schema } from "mongoose";

const availabilitySchema = new Schema({
  weekly: [{ weekday: { type: Number, min: 0, max: 6 }, open: String, close: String, enabled: Boolean }],
  exceptions: [{ date: { type: String, required: true }, enabled: Boolean, open: String, close: String }],
  blockedDates: [{ type: String }],
  slotMinutes: { type: Number, default: 30, min: 5, max: 480 },
  bufferMinutes: { type: Number, default: 0, min: 0, max: 240 },
  breakStart: String,
  breakEnd: String,
  timeZone: { type: String, default: "Africa/Johannesburg" },
}, { timestamps: true });

export default mongoose.models.Availability ?? mongoose.model("Availability", availabilitySchema);
