import mongoose, { Schema } from "mongoose";
const counterSchema = new Schema({ _id: { type: String, required: true }, value: { type: Number, required: true, default: 0 } }, { versionKey: false });
export default mongoose.models.Counter ?? mongoose.model("Counter", counterSchema);
