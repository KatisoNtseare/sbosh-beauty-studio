import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema({
  type: { type: String, enum: ["ADMIN_NEW_BOOKING", "CUSTOMER_APPROVED", "CUSTOMER_REJECTED"], required: true },
  recipient: { type: String, default: "" },
  subject: { type: String, required: true },
  status: { type: String, enum: ["PENDING", "SENDING", "SENT", "FAILED"], default: "PENDING" },
  attemptCount: { type: Number, default: 0 },
  sentAt: Date,
  lastFailure: { type: String, maxlength: 500 },
  attemptedAt: Date,
}, { _id: true });

const serviceSnapshotSchema = new Schema({
  id: { type: Schema.Types.ObjectId },
  name: { type: String, required: true },
  description: String,
  fullDescription: String,
  image: String,
  priceLabel: String,
  price: Number,
  priceConfirmed: Boolean,
  minimumPrice: Number,
  maximumPrice: Number,
  category: String,
  classification: { type: String, enum: ["LASHES", "NAILS", "TOES", "GENERAL"] },
  durationMinutes: Number,
  isPackage: { type: Boolean, default: false },
  components: [{ id: Schema.Types.ObjectId, name: String, price: Number, durationMinutes: Number }],
}, { _id: false });

const extraLineSchema = new Schema({ key: String, name: String, method: { type: String, enum: ["PER_NAIL", "PER_DESIGN"] }, unitPrice: Number, quantity: Number, subtotal: Number, durationMinutes: Number, componentId: String, componentName: String }, { _id: false });
const bookingItemSnapshotSchema = new Schema({ id: Schema.Types.ObjectId, kind: { type: String, enum: ["service", "package"] }, name: String, price: Number, priceConfirmed: Boolean, durationMinutes: Number }, { _id: false });

const bookingSchema = new Schema({
  reference: { type: String, required: true, unique: true, index: true },
  customer: { name: { type: String, required: true }, phone: { type: String, default: "" }, email: { type: String, lowercase: true, trim: true } },
  service: { type: serviceSnapshotSchema, required: true },
  items: { type: [bookingItemSnapshotSchema], default: [] },
  extras: { type: [extraLineSchema], default: [] },
  totalPrice: { type: Number, min: 0 },
  priceNeedsConfirmation: { type: Boolean, default: false },
  priceConfirmedAt: Date,
  priceConfirmedBy: String,
  description: { type: String, default: "", maxlength: 5000 },
  preferredDate: { type: String, required: true }, preferredTime: { type: String, required: true },
  confirmedDate: String, confirmedStart: String, confirmedEnd: String,
  status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"], default: "PENDING", index: true },
  rejectionReason: String,
  approvedAt: Date, completedAt: Date, cancelledAt: Date, decidedBy: String,
  history: [{ status: String, at: Date, by: String, note: String }],
  notifications: { type: [notificationSchema], default: [] },
  idempotencyKey: { type: String, unique: true, sparse: true },
  idempotencyFingerprint: { type: String, select: false },
}, { timestamps: true });

bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ "customer.name": 1 });
bookingSchema.index({ "service.id": 1 });
bookingSchema.index({ confirmedDate: 1, confirmedStart: 1 });
export default mongoose.models.Booking ?? mongoose.model("Booking", bookingSchema);
