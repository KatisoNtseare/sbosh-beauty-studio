import Counter from "@/models/Counter";
import Booking from "@/models/Booking";

export async function nextBookingReference() {
  const [legacyCounter] = await Booking.aggregate([
    { $match: { reference: /^#SBS\d+$/ } },
    { $set: { sequence: { $convert: { input: { $substrBytes: ["$reference", 4, 100] }, to: "long", onError: 0, onNull: 0 } } } },
    { $group: { _id: null, maximum: { $max: "$sequence" } } },
  ]);
  const observed = Number(legacyCounter?.maximum ?? 0);
  try {
    await Counter.updateOne({ _id: "booking-reference" }, { $max: { value: observed } }, { upsert: true, setDefaultsOnInsert: false });
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === 11000)) throw error;
  }
  const counter = await Counter.findOneAndUpdate(
    { _id: "booking-reference" },
    { $inc: { value: 1 } },
    { new: true },
  ).lean();
  return "#SBS" + counter!.value;
}
