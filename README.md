# Sbosh's Beauty Studio

Appointment requests and salon management for the Bram Fischerville, Roodepoort studio. Customers request a service and preferred time; the studio reviews every request and confirms it by email.

## Stack and structure

- Next.js 16 App Router, React 19 and TypeScript
- MongoDB Atlas with Mongoose
- Tailwind CSS 4 and React Icons
- Vitest for unit and replica-set integration tests
- Cloudinary REST API for optional service images
- Zoho SMTP through Nodemailer for booking email

Application routes and UI live in `src/app` and `src/components`; MongoDB models are in `src/models`, and scheduling, email, booking integrity and timezone helpers are in `src/lib`.

## Database environments

| Environment | Database |
| --- | --- |
| Local application development | MongoDB Atlas development cluster through `MONGODB_URI` |
| Production application | MongoDB Atlas production cluster through the deployment's `MONGODB_URI` secret |
| Automated integration tests | Dedicated local MongoDB replica set through `MONGODB_TEST_URI` |

The application reads only `MONGODB_URI`. Integration-test setup requires `MONGODB_TEST_URI`, validates that it is a loopback host, the `sbosh_beauty_test` database, and a replica-set URI, then assigns that validated value to the app connector. It never falls back to `MONGODB_URI`. Keep the Atlas development and production credentials in their respective private environments; never copy them into the test URI.

## Install and run

1. Use Node.js 20.9 or newer. Use MongoDB Atlas for local application development.
2. Copy `.env.example` to `.env.local`, then set the Atlas development connection and local values. Keep `.env.local` private.
3. Run `npm install`, then `npm run dev`.
4. Open `http://localhost:3000`. Sign in at `/admin` after seeding the administrator with `npm run seed:admin`.

## Customer booking flow

Customers select a public service and use **Book now** to open `/cart?service=<id>`. The service is preselected and shown with its image, description and price. Customers choose a date, then select a time returned by the server's current availability calculation. Name and email are required; phone and notes are optional.

Each request is stored as `PENDING` and receives a sequential reference such as `#SBS1`. A request is not an appointment confirmation. The studio reviews it in `/admin` and approves it at the requested or another available time, or rejects it with an optional reason. Customers receive the decision by email. Pending requests do not reserve appointment time. Approval rechecks availability and retains the MongoDB atomic reservation and overlap protection.

There is no payment step. Email is the official booking communication channel; phone is retained for reference only.

## Zoho SMTP configuration

Use the existing private environment keys in `.env.local` and the hosting secret store:

| Variable | Purpose |
| --- | --- |
| `ZOHO_SMTP_HOST` | Zoho SMTP host for the account and region |
| `ZOHO_SMTP_PORT` | SMTP port; port 465 uses implicit TLS, other configured ports use STARTTLS |
| `ZOHO_SMTP_USER` | Zoho mailbox / authenticated sender |
| `ZOHO_SMTP_PASS` | Zoho mailbox password or app-specific password |
| `CONTACT_RECEIVER` | Administrator booking notification recipient; falls back to `ADMIN_EMAIL` |
| `NEXT_PUBLIC_APP_URL` | Public application URL used for the dashboard link |
| `ADMIN_EMAIL` | Administrator sign-in identity and fallback notification recipient |

An administrator email is recorded on each booking before delivery. SMTP delivery happens after booking state is saved. Failed notices remain visible in the dashboard and can be retried; delivery errors do not undo a booking or approval. Notification records prevent routine duplicate sends and track attempts, delivery time and a safe failure message.

## Availability and appointment lengths

In `/admin`, select a reference date to identify a weekday, set opening and closing times, and save a recurring weekly schedule. The interface states which weekday will repeat. Editing a weekday replaces its current schedule. Add specific dates under **Closed dates**; the recurring hours resume the following week. The old one-off opening interface is removed. Old closed dates are retained, and old one-off openings are preserved for review by the migration.

Scheduling uses `Africa/Johannesburg` calendar dates and times. It respects weekly periods, closed dates, breaks, blocked periods, approved reservations and the configured slot interval and buffer. A time is offered only if the full appointment fits before closing.

Appointment length is derived on the server from the service classification:

- Lashes: 45 minutes
- Nails: 120 minutes
- Toes: 120 minutes
- Other services: 120 minutes

The admin service editor exposes the classification, not an editable duration. Legacy duration values are ignored for new requests. Existing booking snapshots and reservation intervals remain available for history.

## Admin and service setup

Admin APIs require an HTTP-only, `SameSite=Strict` signed session cookie. Sessions expire after eight hours; sign-in uses a MongoDB-backed fixed-window limiter. Seed or reset the administrator from `.env.local` with `npm run seed:admin`; the password is stored as a salted scrypt hash.

On an empty service collection, the public service menu creates inactive setup templates for Manicure, Gel Nails, Overlay, Nail Repair and Buff & Shine. Review names, classification, prices, descriptions and images in `/admin`, and activate only approved services. These templates are not publicly bookable until activated. Services with booking history are archived rather than deleted. Booking snapshots are not rewritten when a service is edited.

Cloudinary image management is disabled unless all three Cloudinary settings are present. JPG, PNG and WebP uploads are limited to 5 MB and validated server-side.

The public booking endpoint limits requests to five per source IP per minute. Forwarded headers are ignored unless `TRUST_PROXY_HEADERS=true` is configured behind a trusted proxy that overwrites them and prevents direct origin access.

## Safe data migration

After taking a database backup, run the idempotent migration:

```powershell
npm run migrate:booking-workflow
```

It classifies existing services using their category and name, copies legacy closed-date exceptions into `blockedDates`, preserves legacy one-off opening rules in `legacyOpeningRules` for administrator review, migrates old break fields, and clears the obsolete exceptions. It never resets collections or changes historical bookings or reservations. Re-running it is safe.

After migration, review the warning in the admin availability screen and add any useful regular weekdays as recurring schedules. Existing service duration values remain stored for audit but are no longer used to calculate new appointments.

## Tests and checks

```bash
npm test
npm run test:integration
npm run lint
npx tsc --noEmit
npm run build
```

MongoDB integration tests run locally and do not run in GitHub Actions. Install MongoDB Community Server natively for tests only; the application continues to use Atlas. Start a separate local test server on port 27018 with a dedicated data directory. In PowerShell terminal 1:

```powershell
New-Item -ItemType Directory -Force "$env:LOCALAPPDATA\SboshBeautyStudio\test-mongodb" | Out-Null
$mongod = Get-ChildItem "$env:ProgramFiles\MongoDB\Server\*\bin\mongod.exe" | Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
if (-not $mongod) { throw "Install MongoDB Community Server or add mongod to PATH." }
& $mongod --replSet rs0 --port 27018 --dbpath "$env:LOCALAPPDATA\SboshBeautyStudio\test-mongodb" --bind_ip 127.0.0.1
```

Keep that terminal open. In terminal 2, set the local test URI in `.env.local` or the shell, then initialize and run the suite:

```powershell
# Set this in .env.local (already ignored by Git) or in the shell:
$env:MONGODB_TEST_URI = "mongodb://127.0.0.1:27018/sbosh_beauty_test?replicaSet=rs0"
npm run test:db:init
npm run test:integration
```

`test:db:init` only initializes the local replica set; it does not delete data. The test suite serializes concurrent runs with a run-owned lock, requires its application collections to be empty, refuses nonlocal or non-replica-set URIs, uses unique run IDs, mocks Nodemailer, and cleans only documents created by that run. It never drops the database or falls back to `MONGODB_URI`. Stop the test server with Ctrl+C in terminal 1. Never point tests at an application or production database.

## Database reset and backup

Database resets are destructive. First verify the private `MONGODB_URI` target and take a verified backup with MongoDB Database Tools (`mongodump`) or an approved native export of the application collections. Record collection names and counts, then clear only the application's model-owned collections with `deleteMany({})`; preserve indexes and unrelated collections. Verify each cleared collection is empty and reseed the administrator with `npm run seed:admin`. Keep backups outside the repository and never commit database exports or `.env.local`.

## Production configuration

- Set a dedicated production MongoDB URI, replica-set transactions, admin credentials and a random 32+ character `AUTH_SECRET` in the deployment secret store.
- Configure Zoho SMTP, `CONTACT_RECEIVER`, and the public `NEXT_PUBLIC_APP_URL`.
- Configure HTTPS and a trusted proxy before enabling proxy header trust.
- Review real service pricing, classifications, descriptions, photos, weekly schedules, breaks and buffers in the admin area.
- Run migration after backup, review preserved one-off opening rules, and test booking approval/rejection and email delivery against non-production services first.
- Back up the database and define retention/access rules for customer information.
