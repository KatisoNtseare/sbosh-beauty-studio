import mongoose, { Schema } from "mongoose";

const bookingSchema = new Schema({
  reference: { type: String, required: true, unique: true, index: true },
  customer: { name: { type: String, required: true }, phone: { type: String, required: true }, email: String },
  service: { id: { type: Schema.Types.ObjectId, required: true }, name: { type: String, required: true }, description: String, fullDescription: String, image: String, priceLabel: String, minimumPrice: Number, maximumPrice: Number, category: String, durationMinutes: Number },
  description: { type: String, required: true, maxlength: 5000 },
  preferredDate: { type: String, required: true }, preferredTime: { type: String, required: true },
  confirmedDate: String, confirmedStart: String, confirmedEnd: String,
  status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"], default: "PENDING", index: true },
  rejectionReason: String,
  approvedAt: Date, completedAt: Date, cancelledAt: Date, decidedBy: String,
  history: [{ status: String, at: Date, by: String, note: String }],
  whatsapp: [{
    bookingId: { type: Schema.Types.ObjectId, required: true },
    type: { type: String, enum: ["BOOKING_CONFIRMATION", "REJECTION_NOTIFICATION", "THANK_YOU"], required: true },
    adminId: { type: String, required: true },
    at: { type: Date, default: Date.now },
    status: { type: String, enum: ["SENT_MANUALLY"], required: true },
    content: { type: String, required: true, maxlength: 3000 },
  }],
  idempotencyKey: { type: String, unique: true, sparse: true },
  idempotencyFingerprint: { type: String, select: false },
}, { timestamps: true });

bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ "customer.name": 1 });
bookingSchema.index({ "service.id": 1 });
bookingSchema.index({ confirmedDate: 1, confirmedStart: 1 });
export default mongoose.models.Booking ?? mongoose.model("Booking", bookingSchema);
