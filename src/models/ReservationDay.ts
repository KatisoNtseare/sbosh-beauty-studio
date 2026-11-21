import mongoose, { Schema } from "mongoose";

const reservationDaySchema = new Schema({
  date: { type: String, required: true, unique: true },
  reservations: [{ bookingId: { type: Schema.Types.ObjectId, required: true }, start: { type: Number, required: true }, end: { type: Number, required: true } }],
}, { timestamps: true });

export default mongoose.models.ReservationDay ?? mongoose.model("ReservationDay", reservationDaySchema);
