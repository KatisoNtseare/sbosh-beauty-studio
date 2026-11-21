# Sbosh's Beauty Studio

Responsive nail studio website and appointment request/admin system for the Bram Fischerville, Roodepoort salon. Customers request a service and preferred time; the studio reviews the request and confirms it manually.

## Stack

- Next.js 16 App Router, React 19, TypeScript
- MongoDB Atlas with Mongoose
- Tailwind CSS 4 and React Icons
- Vitest for unit and schema tests
- Cloudinary REST API for service images (optional; server-side credentials only)

## Project structure

```text
src/app/                  Public pages, admin page, route handlers
src/components/           Public website, booking and admin UI
src/lib/                  Brand profile, database, domain and scheduling helpers
src/models/                MongoDB service, booking, schedule, reservation and rate-limit models
public/images/            Local website imagery and fallbacks
tests/                     Unit, scheduling and schema tests
```

## Install and run

1. Install Node.js 20.9 or newer and MongoDB Atlas credentials for a development database.
2. Copy `.env.example` to `.env.local` and set each required value. Keep `.env.local` untracked.
3. Run `npm install`, `npm run dev`, then open `http://localhost:3000`.
4. Sign in at `/admin`, configure service durations and opening hours, then test a booking request.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string for this environment/database |
| `AUTH_SECRET` | Yes | Random server secret of at least 32 characters for signing admin sessions |
| `ADMIN_EMAIL` | Yes | Initial administrator login and audit identity |
| `ADMIN_PASSWORD` | Yes for seeding | Initial administrator password, hashed before storage |
| `ADMIN_NAME` | No | Name shown in admin history; defaults to the admin email |
| `APP_TIMEZONE` | No | Salon timezone; scheduling is fixed to `Africa/Johannesburg` |
| `NEXT_PUBLIC_APP_URL` | No | Public application URL |
| `TRUST_PROXY_HEADERS` | No | Set to `true` only when a trusted ingress overwrites the client IP header and blocks direct origin access; defaults to `false` |
| `MONGODB_TEST_URI` | Integration tests only | Explicit URI to an empty, isolated database named `sbosh_beauty_test`; never falls back to `MONGODB_URI` |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary account name for service image uploads |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key, used by server routes |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API secret, never sent to the browser |

Cloudinary image management is disabled unless all three Cloudinary values are present. The application accepts JPG, PNG, and WebP service photos up to 5 MB, validates the file signature on the server, and sends uploads/deletes to Cloudinary from a protected route. It does not add another image provider.

## Admin setup and service management

Admin APIs require an HTTP-only, `SameSite=Strict` signed session cookie. Sessions expire after eight hours. Admin sign-in is limited through a MongoDB-backed fixed-window limiter. To seed or reset the administrator from `.env.local`, run `npm run seed:admin`. The script upserts the configured email, name and scrypt password hash into the `admins` collection; it never stores the plaintext password. Login then checks the database account. Keep `AUTH_SECRET` configured for signing sessions. Never use production credentials in local tests.

The first service-menu request on an empty database inserts inactive setup templates (Manicure, Gel Nails, Overlay, Nail Repair, and Buff & Shine). Treat these names as placeholders: prices, descriptions and durations start blank, and the templates are not publicly bookable. In `/admin`, review or replace them with the actual menu, configure price and duration, then activate only approved services. Existing database services are not silently changed. The owner can create, edit, order, activate/deactivate, or delete services, including short and full descriptions, category, price range, duration, and image. A service with historical bookings is archived rather than deleted. Each booking stores a service snapshot so later edits do not change its history.

Only active services appear publicly. Book Now preselects the chosen service. A service cannot accept booking preferences until its duration is configured.

## Customer booking flow

Customers submit a name, WhatsApp number, optional email, selected service, preferred available date/time, and a full description (up to 5,000 characters). The server normalizes South African numbers to international format, retrieves service details from MongoDB, validates current availability, saves the original service snapshot, and creates a unique reference with `PENDING` status. A request is not a confirmed appointment.

The public endpoint allows five requests per source IP per minute through MongoDB-backed rate limiting. Next.js 16 no longer exposes `request.ip`. Forwarded headers are ignored by default. Set `TRUST_PROXY_HEADERS=true` only after the reverse proxy overwrites a single valid `X-Forwarded-For` or `X-Real-IP` value and the application origin cannot be reached directly; otherwise clients could spoof the header. Without a verified proxy, requests share the safe `unknown` rate-limit bucket. All API errors returned to visitors are generic and do not include database details.

## Availability and scheduling

In `/admin`, configure each weekday with one or more working periods, shared breaks, per-date open/closed overrides, blocked dates, blocked time periods, service durations, slot step, and buffer. Availability is stored in MongoDB; no salon hours or treatment durations are hard-coded. The admin calendar separates confirmed visits from pending requests.

Date keys use `YYYY-MM-DD` in `Africa/Johannesburg` and are not converted through UTC for display or matching. The scheduler subtracts breaks, blocked intervals, existing reservations, and configured buffers, using each selected service’s trusted duration.

## Collision protection and MongoDB

Collections:

- `Admin`: normalized login email, display name, active flag and salted scrypt password hash.
- `Service`: customer-facing descriptions, image references, category, price/duration and lifecycle.
- `Booking`: customer request, service snapshot, status/audit history and manual WhatsApp records.
- `Availability`: weekly periods, exceptions, blocked dates/times, breaks and buffers.
- `ReservationDay`: one document per salon-local date with confirmed appointment intervals.
- `rate_limits`: shared fixed-window request counters with TTL cleanup.

Each reservation write uses a conditional atomic update on the unique date document. It rejects intervals that intersect using `newStart < existingEnd && newEnd > existingStart`; buffer minutes are included in the stored interval. Approval, rescheduling, cancellation and completion use MongoDB transactions when the deployment supports them. On standalone MongoDB, the app falls back to the conditional single-document reservation write plus a guarded booking-status update and compensating release. Pending requests never reserve a time.

The MongoDB deployment must support transactions for atomic cross-document state changes; MongoDB Atlas does. The fallback still prevents concurrent overlaps, though a process crash between the reservation and booking updates can leave a stale interval that needs admin/database cleanup.

## Manual WhatsApp communication

No WhatsApp API, automated messages, or email integration is used. The admin page creates a prefilled `wa.me` URL only for the matching status: approved confirmation, rejected notification, or completed thank-you. International phone numbers and URL-encoded message text are used. Opening WhatsApp is not counted as sent. The administrator must confirm manually; the server then stores the booking ID, message type/content, administrator ID, timestamp, and `SENT_MANUALLY` status, and prevents a duplicate record for that message type.

## Tests and checks

```bash
npm test
npm run test:integration
npm run lint
npx tsc --noEmit
npm run build
```

The unit test suite covers input validation, service snapshots/lifecycle policy, booking idempotency fingerprints, dashboard statistics, password hashing, allowed status/message mapping, phone normalization, message encoding, salon-local slot calculations, timezone boundaries, breaks/exceptions/blocked intervals, spoofed proxy headers, overlap rules, and declared MongoDB indexes.

MongoDB integration tests use the actual models, route handlers and atomic reservation operations. They require an explicitly configured, empty replica-set database named `sbosh_beauty_test`; they never use `MONGODB_URI` and never drop a database or collection. Configure a local replica set, then run:

```powershell
$env:MONGODB_TEST_URI = "mongodb://127.0.0.1:27017/sbosh_beauty_test?replicaSet=rs0"
npm run test:integration
```

The integration suite refuses a missing URI, a different database name, or a non-empty test database. It deletes only the records it created. Never point this variable at production Atlas.

## Production checklist

- Use a dedicated production Atlas database and allow network access only from the deployment environment.
- Configure a replica-set/sharded MongoDB deployment for transactions.
- Configure `TRUST_PROXY_HEADERS=true` only after verifying the deployed reverse proxy overwrites the client IP header and prevents direct origin access.
- Set admin credentials, a random 32+ character `AUTH_SECRET`, and Cloudinary server secrets in the platform secret store.
- Configure the reverse proxy to sanitize/overwrite `X-Forwarded-For` and use HTTPS.
- Set and review service durations, prices, photos, opening periods, breaks, buffers, exceptions, and blocked intervals in `/admin`.
- Run tests, lint, type checks, and production build before release.
- Configure `TRUST_PROXY_HEADERS=true` only after verifying that the deployed reverse proxy overwrites the client IP header and prevents direct origin access.
- Verify service image upload, booking submission, approval, rescheduling, WhatsApp tracking, cancellation, and completion against a non-production database.
- Back up MongoDB regularly and define retention/access rules for customer contact information.
