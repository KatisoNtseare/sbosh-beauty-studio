# Sbosh Beauty Studio

Customer service booking requests and a private salon administration area built with Next.js 16, React 19, TypeScript, MongoDB, and Mongoose.

## Booking workflow

1. The home page reads the active service menu from MongoDB. The first visit seeds only the confirmed services: Manicure, Gel Nails, Overlay, Nail Repair, and Buff & Shine. Prices, durations, and descriptions remain unset until staff configure them.
2. Customers choose a service, an administrator-configured date and time, their contact details, and a full description (up to 5,000 characters).
3. The request is saved as `PENDING` with a reference and service snapshot. A request is not an appointment confirmation.
4. An administrator reviews the request at `/admin`, then approves a configured available time or rejects it with an optional reason.
5. WhatsApp links open a manually prefilled message. Staff must separately record that the message was sent. No message or email is sent by the application.
6. Approved appointments can be marked complete. Completion releases the time for future availability and preserves the booking history.

## Database records

- `Service`: confirmed menu and configurable description, image, price label, and duration.
- `Booking`: customer request, submitted service snapshot, preferences, decision history, and WhatsApp send tracking.
- `Availability`: weekly schedule, exceptions, blocked dates, slot step, buffer, and salon timezone.
- `ReservationDay`: one atomic document per local date containing confirmed appointment intervals.

## Collision protection

Approval writes to a single `ReservationDay` document using an atomic conditional update. Its filter rejects any interval where `newStart < existingEnd && newEnd > existingStart`, so concurrent admins cannot reserve overlapping appointments even when MongoDB transactions are unavailable. Pending requests do not reserve time. Completion removes the reservation while keeping the booking record. Keep appointment lengths to a single calendar day; overnight services are not supported.

## Setup

Create `.env.local` in the project root:

```dotenv
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
AUTH_SECRET=<long-random-secret-at-least-32-characters>
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<strong-unique-password>
APP_TIMEZONE=Africa/Johannesburg
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

The administrator credentials are required for `/admin`; the app fails closed when they are missing. Use a strong unique password and keep `.env.local` out of source control. MongoDB Atlas must allow connections from the deployed application. Set the runtime timezone to `Africa/Johannesburg`.

```bash
npm install
npm run dev
```

Visit `/admin`, sign in, and configure weekly opening hours, appointment step, buffer, and blocked dates. Use “Availability & services” to set a confirmed price, duration, and description for each service. Without configured hours, customers cannot select a date/time.

## Security and operations

- Public booking input is validated on the server; service price, name, and duration are read from MongoDB.
- The public endpoint applies an in-process limit of five requests per source IP per minute. For horizontally scaled production hosting, replace this with a shared Redis or MongoDB rate limiter.
- Admin APIs require a signed, HTTP-only, same-site session cookie. Use HTTPS in production.
- Never store actual customer credentials in this repository or share `.env.local` values.

## Verification

```bash
npm run lint
npx tsc --noEmit
npm run build
```

There is no configured test runner in this repository. End-to-end booking verification requires a reachable MongoDB database, configured admin credentials, and a schedule set through `/admin`.
