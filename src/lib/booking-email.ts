import mongoose from "mongoose";
import nodemailer, { type Transporter } from "nodemailer";
import path from "node:path";
import pug from "pug";
import Booking from "@/models/Booking";
import { businessProfile } from "@/lib/brand";
import { getStudioContact } from "@/lib/site-settings";

export type BookingEmailType = "ADMIN_NEW_BOOKING" | "CUSTOMER_REQUEST_RECEIVED" | "CUSTOMER_APPROVED" | "CUSTOMER_REJECTED";

type EmailContent = { recipient: string; subject: string; text: string; html: string };
type DeliveryResult = { sent: boolean; warning?: string };

let cachedTransport: { key: string; transport: Transporter } | null = null;

function smtpTransport(contactEmail: string = businessProfile.contact.email) {
  const host = (process.env.ZOHO_SMTP_HOST || process.env.ZohoSmtp_Host)?.trim();
  const user = (process.env.ZOHO_SMTP_USER || process.env.ZohoSmtp_Username)?.trim();
  const pass = process.env.ZOHO_SMTP_PASS || process.env.ZohoSmtp_Password;
  const sender = (process.env.ZohoSmtp_FromEmail || user || contactEmail || "").trim();
  const senderName = (process.env.ZohoSmtp_FromName || businessProfile.name).trim();
  const port = Number(process.env.ZOHO_SMTP_PORT || process.env.ZohoSmtp_Port || 465);
  if (!host || !user || !pass || !Number.isInteger(port) || port < 1 || port > 65535) return null;
  const key = `${host}:${port}:${user}`;
  if (cachedTransport?.key === key) return { transport: cachedTransport.transport, sender, senderName };
  const secure = port === 465;
  const transport = nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure,
    auth: { user, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  cachedTransport = { key, transport };
  return { transport, sender, senderName };
}

function appointment(date: string, time: string) {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return `${date} at ${time}`;
  const formatted = new Intl.DateTimeFormat("en-ZA", { dateStyle: "full", timeZone: businessProfile.timezone }).format(parsed);
  return `${formatted} at ${time} (${businessProfile.timezone})`;
}

function contentFor(booking: NonNullable<Awaited<ReturnType<typeof Booking.findById>>>, type: BookingEmailType, studioContact: Awaited<ReturnType<typeof getStudioContact>>): EmailContent {
  const record = booking as unknown as {
    reference: string; customer: { name?: string; email?: string; phone?: string }; service: { name?: string };
    totalPrice?: number; priceNeedsConfirmation?: boolean; preferredDate: string; preferredTime: string;
    confirmedDate?: string; confirmedStart?: string; confirmedEnd?: string; rejectionReason?: string; description?: string;
  };
  const adminRecipient = process.env.CONTACT_RECEIVER?.trim() || process.env.ADMIN_EMAIL?.trim() || "";
  const isAdmin = type === "ADMIN_NEW_BOOKING";
  const recipient = isAdmin ? adminRecipient : record.customer.email?.trim() || "";
  const approved = type === "CUSTOMER_APPROVED";
  const rejected = type === "CUSTOMER_REJECTED";
  const date = approved ? record.confirmedDate || record.preferredDate : record.preferredDate;
  const time = approved ? record.confirmedStart || record.preferredTime : record.preferredTime;
  const subject = isAdmin
    ? `New booking request ${record.reference}`
    : approved ? `Your booking is approved · ${record.reference}`
      : rejected ? `An update about your booking · ${record.reference}`
        : `We received your booking request · ${record.reference}`;
  const heading = isAdmin ? "New booking request" : approved ? "Your booking is approved" : rejected ? "Booking request update" : "We received your request";
  const statusText = isAdmin ? "A customer submitted a booking request. Review it in the admin dashboard." : approved
    ? "The studio approved your booking. Your appointment is confirmed for the time below."
    : rejected ? `The studio could not approve this request.${record.rejectionReason ? ` Reason: ${record.rejectionReason}` : " Please contact the studio if you would like to discuss another time."}`
      : "Your request is saved and is waiting for the studio to review it. Your appointment is not confirmed yet.";
  const timeLabel = appointment(date, time);
  const price = record.priceNeedsConfirmation || typeof record.totalPrice !== "number" ? "To be confirmed with you" : `R${record.totalPrice}`;
  const customerPhoneDigits = (record.customer.phone || "").replace(/\D/g, "");
  const whatsappNumber = customerPhoneDigits.startsWith("0") ? `27${customerPhoneDigits.slice(1)}` : customerPhoneDigits;
  const whatsappUrl = whatsappNumber.length >= 9 ? `https://wa.me/${whatsappNumber}` : "";
  const adminDetails = isAdmin ? [`Customer: ${record.customer.name || ""}`, `Email: ${record.customer.email || ""}`, `Phone: ${record.customer.phone || ""}`, `Notes: ${record.description || "None"}`] : [];
  const text = [
    `Hello ${isAdmin ? "Studio Administrator" : record.customer.name || ""},`, "", statusText, "",
    `Reference: ${record.reference}`, `Service or package: ${record.service.name || "Booking"}`,
    `${approved ? "Confirmed appointment" : "Requested appointment"}: ${timeLabel}`, `Total: ${price}`,
    `Studio: ${businessProfile.name}`, `Phone: ${studioContact.phone}`, `Email: ${studioContact.email}`, `Address: ${studioContact.address}`,
    `Map: ${studioContact.mapHref}`, ...(isAdmin ? [`Admin dashboard: ${(process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "")}/admin`, ...(whatsappUrl ? [`Text customer on WhatsApp: ${whatsappUrl}`] : []), ...adminDetails] : []),
  ].filter(Boolean).join("\n");
  const baseLocals = { subject, reference: record.reference, serviceName: record.service.name || "Booking", price, timeLabel };
  const html = isAdmin
    ? pug.renderFile(path.join(process.cwd(), "src/lib/email-templates/admin-booking.pug"), {
      ...baseLocals,
      cache: process.env.NODE_ENV === "production",
      heading,
      intro: statusText,
      customerName: record.customer.name || "",
      customerEmail: record.customer.email || "",
      customerPhone: record.customer.phone || "",
      whatsappUrl,
      notes: record.description || "None",
      adminUrl: `${(process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "")}/admin`,
    })
    : pug.renderFile(path.join(process.cwd(), "src/lib/email-templates/customer-booking.pug"), {
      ...baseLocals,
      cache: process.env.NODE_ENV === "production",
      eyebrow: approved ? "Appointment confirmed" : rejected ? "Booking update" : "Request received",
      heading,
      intro: statusText,
      timeCaption: approved ? "Confirmed appointment" : "Requested appointment",
      phoneHref: studioContact.phoneHref,
      emailHref: studioContact.emailHref,
      mapHref: studioContact.mapHref,
      studioPhone: studioContact.phone,
      studioEmail: studioContact.email,
      address: studioContact.address,
    });
  return { recipient, subject, text, html };
}

function deliveryError(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  return code === "EAUTH"
    ? "Zoho SMTP authentication failed. Check the mailbox and app-specific password."
    : "Email could not be delivered. Check the Zoho SMTP settings and retry.";
}

export async function sendBookingEmail(bookingId: mongoose.Types.ObjectId | string, type: BookingEmailType, forceRetry = false): Promise<DeliveryResult> {
  const booking = await Booking.findById(bookingId);
  if (!booking) return { sent: false, warning: "Booking was not found for email delivery." };
  const studioContact = await getStudioContact();
  const message = contentFor(booking, type, studioContact);
  const notifications = booking.notifications as unknown as { _id: mongoose.Types.ObjectId; type: BookingEmailType; status: string; attemptedAt?: Date; attemptCount: number }[];
  const existing = notifications.find((item) => item.type === type);
  if (existing?.status === "SENT") return { sent: true };
  if (existing?.status === "SENDING" && !forceRetry && existing.attemptedAt && Date.now() - existing.attemptedAt.getTime() < 5 * 60_000) {
    return { sent: false, warning: "Email delivery is already in progress." };
  }

  const notificationId = existing?._id ?? new mongoose.Types.ObjectId();
  const attemptedAt = new Date();
  if (existing) {
    const claimed = await Booking.updateOne(
      { _id: booking._id, notifications: { $elemMatch: { _id: notificationId, status: existing.status } } },
      { $set: { "notifications.$.recipient": message.recipient, "notifications.$.subject": message.subject, "notifications.$.status": "SENDING", "notifications.$.attemptedAt": attemptedAt, "notifications.$.lastFailure": "" }, $inc: { "notifications.$.attemptCount": 1 } },
    );
    if (!claimed.modifiedCount) return { sent: false, warning: "Email delivery state changed. Refresh the booking and try again." };
  } else {
    const claimed = await Booking.updateOne(
      { _id: booking._id, notifications: { $not: { $elemMatch: { type } } } },
      { $push: { notifications: { _id: notificationId, type, recipient: message.recipient, subject: message.subject, status: "SENDING", attemptCount: 1, attemptedAt } } },
    );
    if (!claimed.modifiedCount) return forceRetry ? sendBookingEmail(bookingId, type, false) : { sent: false, warning: "Email notification is already in progress." };
  }

  let status: "SENT" | "FAILED" = "FAILED";
  let failure = "";
  const mailer = smtpTransport(studioContact.email);
  if (!mailer) failure = "Zoho SMTP is not configured. Set the sender mailbox, app-specific password, host, port, and recipient.";
  else if (!message.recipient) failure = type === "ADMIN_NEW_BOOKING" ? "No admin recipient is configured. Set CONTACT_RECEIVER or ADMIN_EMAIL." : "Customer email address is missing.";
  else {
    try {
      await mailer.transport.sendMail({
        from: { name: mailer.senderName, address: mailer.sender },
        to: message.recipient,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
      status = "SENT";
    } catch (error) { failure = deliveryError(error); }
  }
  await Booking.updateOne(
    { _id: booking._id, "notifications._id": notificationId },
    { $set: { "notifications.$.status": status, "notifications.$.sentAt": status === "SENT" ? new Date() : undefined, "notifications.$.lastFailure": failure } },
  );
  return status === "SENT" ? { sent: true } : { sent: false, warning: failure };
}
