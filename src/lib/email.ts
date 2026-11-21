import nodemailer from "nodemailer";
import mongoose from "mongoose";
import Booking from "@/models/Booking";
import { businessProfile } from "@/lib/brand";

type NoticeType = "ADMIN_NEW_BOOKING" | "CUSTOMER_APPROVED" | "CUSTOMER_REJECTED";
type BookingMail = {
  reference: string;
  customer: { name: string; email: string; phone?: string };
  service: { name: string; priceLabel?: string; minimumPrice?: number; maximumPrice?: number; components?: { name: string; price?: number }[] };
  extras?: { name: string; unitPrice?: number; method?: string; quantity?: number; subtotal?: number; componentName?: string }[];
  totalPrice?: number;
  priceNeedsConfirmation?: boolean;
  preferredDate: string;
  preferredTime: string;
  confirmedDate?: string;
  confirmedStart?: string;
  rejectionReason?: string;
  description?: string;
};
type NotificationRecord = { _id: mongoose.Types.ObjectId | string; type: NoticeType; recipient: string; subject: string; status: string; attemptedAt?: Date };
const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
const salonDate = (value: string) => new Intl.DateTimeFormat("en-ZA", { dateStyle: "long", timeZone: "UTC" }).format(new Date(value + "T12:00:00Z"));
const price = (service: { priceLabel?: string; minimumPrice?: number; maximumPrice?: number }) => service.priceLabel || (service.minimumPrice != null && service.maximumPrice != null ? "R" + service.minimumPrice + "–R" + service.maximumPrice : service.minimumPrice != null ? "From R" + service.minimumPrice : "Price to be confirmed");
const priceLine = (booking: BookingMail) => booking.priceNeedsConfirmation ? "Price: To be confirmed by the studio" : typeof booking.totalPrice === "number" ? "Total: R" + booking.totalPrice : "Price: " + price(booking.service);

function content(type: NoticeType, booking: BookingMail) {
  const customer = booking.customer; const service = booking.service; const reference = booking.reference;
  const date = type === "CUSTOMER_APPROVED" ? booking.confirmedDate : booking.preferredDate;
  const time = type === "CUSTOMER_APPROVED" ? booking.confirmedStart : booking.preferredTime;
  if (!date || !time) throw new Error("Appointment date or time is unavailable.");
  const title = type === "ADMIN_NEW_BOOKING" ? "New booking request" : type === "CUSTOMER_APPROVED" ? "Your appointment is approved" : "Update on your booking request";
  const text = type === "ADMIN_NEW_BOOKING"
    ? [title, "Reference: " + reference, "Customer: " + customer.name, "Email: " + customer.email, "Phone: " + (customer.phone || "Not supplied"), "Service: " + service.name, ...(service.components ?? []).map((component) => `Includes: ${component.name}${typeof component.price === "number" ? ` · R${component.price}` : " · price to confirm"}`), ...(booking.extras ?? []).map((extra) => `Extra: ${extra.name}${extra.componentName ? ` · ${extra.componentName}` : ""} · ${extra.quantity} × R${extra.unitPrice} = R${extra.subtotal}`), priceLine(booking), ...(booking.priceNeedsConfirmation ? ["ACTION REQUIRED: Confirm the service price with the customer before approval."] : []), "Requested: " + salonDate(date) + " at " + time, "Status: PENDING", "Notes: " + (booking.description || "None"), "Admin dashboard: " + (process.env.NEXT_PUBLIC_APP_URL || "") + "/admin"].join("\n")
    : type === "CUSTOMER_APPROVED"
      ? ["Hello " + customer.name + ",", "", "Your appointment request has been approved.", "Reference: " + reference, "Service: " + service.name, ...(service.components ?? []).map((component) => `Includes: ${component.name}${typeof component.price === "number" ? ` · R${component.price}` : " · price to confirm"}`), ...(booking.extras ?? []).map((extra) => `Extra: ${extra.name}${extra.componentName ? ` · ${extra.componentName}` : ""} · ${extra.quantity} × R${extra.unitPrice} = R${extra.subtotal}`), priceLine(booking), "Appointment: " + salonDate(date) + " at " + time, "", "We look forward to welcoming you.", businessProfile.name].join("\n")
      : ["Hello " + customer.name + ",", "", "We’re sorry, but we could not accommodate your request.", "Reference: " + reference, "Service: " + service.name, ...(service.components ?? []).map((component) => `Includes: ${component.name}${typeof component.price === "number" ? ` · R${component.price}` : " · price to confirm"}`), ...(booking.extras ?? []).map((extra) => `Extra: ${extra.name}${extra.componentName ? ` · ${extra.componentName}` : ""} · ${extra.quantity} × R${extra.unitPrice} = R${extra.subtotal}`), priceLine(booking), "Requested: " + salonDate(date) + " at " + time, booking.rejectionReason ? "Reason: " + booking.rejectionReason : "", "Please contact the studio to discuss another suitable appointment.", businessProfile.name].filter(Boolean).join("\n");
  const html = "<div style='font-family:Arial,sans-serif;color:#29271f;max-width:600px;margin:auto;padding:32px'><h1 style='color:#625a3a'>" + escapeHtml(title) + "</h1><p style='line-height:1.7;white-space:pre-line'>" + escapeHtml(text) + "</p><hr style='border:0;border-top:1px solid #ded9cc'><p style='font-size:13px;color:#746f62'>" + escapeHtml(businessProfile.name) + "</p></div>";
  return { subject: title + " · " + reference, text, html };
}

function transporter() {
  const host = process.env.ZOHO_SMTP_HOST; const port = Number(process.env.ZOHO_SMTP_PORT); const user = process.env.ZOHO_SMTP_USER; const pass = process.env.ZOHO_SMTP_PASS;
  if (!host || !Number.isInteger(port) || !user || !pass) throw new Error("Zoho SMTP is not fully configured.");
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

export async function addNotification(bookingId: unknown, type: NoticeType, recipient: string) {
  const target = recipient.trim().toLowerCase();
  const subject = (type === "ADMIN_NEW_BOOKING" ? "New booking request" : type === "CUSTOMER_APPROVED" ? "Your appointment is approved" : "Update on your booking request");
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error("Booking not found.");
  const existing = booking.notifications.find((item: (typeof booking.notifications)[number]) => item.type === type);
  if (existing) return String(existing._id);
  booking.notifications.push({ type, recipient: target, subject, status: "PENDING", attemptCount: 0 });
  await booking.save();
  return String(booking.notifications[booking.notifications.length - 1]._id);
}

export async function sendNotification(bookingId: string, notificationId: string) {
  const query = { _id: new mongoose.Types.ObjectId(bookingId), notifications: { $elemMatch: { _id: new mongoose.Types.ObjectId(notificationId), $or: [{ status: "PENDING" }, { status: "FAILED" }, { status: "SENDING", attemptedAt: { $lt: new Date(Date.now() - 5 * 60_000) } }] } } };
  const claimed = await Booking.findOneAndUpdate(query, { $set: { "notifications.$.status": "SENDING", "notifications.$.attemptedAt": new Date(), "notifications.$.lastFailure": "" }, $inc: { "notifications.$.attemptCount": 1 } }, { returnDocument: "after" }).lean();
  if (!claimed) return { sent: false, skipped: true };
  const typedBooking = claimed as unknown as BookingMail & { notifications: NotificationRecord[] };
  const notice = typedBooking.notifications.find((item) => String(item._id) === notificationId);
  if (!notice) return { sent: false, skipped: true };
  try {
    const recipient = notice.type === "ADMIN_NEW_BOOKING" ? (notice.recipient || adminNotificationRecipient()) : notice.recipient;
    if (!recipient) throw new Error("Administrator notification recipient is not configured.");
    const message = content(notice.type, typedBooking);
    await transporter().sendMail({ from: { name: businessProfile.name, address: process.env.ZOHO_SMTP_USER! }, to: recipient, subject: message.subject, text: message.text, html: message.html });
    await Booking.updateOne({ _id: claimed._id, notifications: { $elemMatch: { _id: notice._id, status: "SENDING" } } }, { $set: { "notifications.$.recipient": recipient, "notifications.$.status": "SENT", "notifications.$.sentAt": new Date(), "notifications.$.lastFailure": "" } });
    return { sent: true, skipped: false };
  } catch {
    await Booking.updateOne({ _id: claimed._id, notifications: { $elemMatch: { _id: notice._id, status: "SENDING" } } }, { $set: { "notifications.$.status": "FAILED", "notifications.$.lastFailure": "Email delivery failed. Check SMTP settings and retry." } });
    return { sent: false, skipped: false };
  }
}

export function adminNotificationRecipient() {
  return process.env.CONTACT_RECEIVER?.trim() || process.env.ADMIN_EMAIL?.trim() || "";
}
