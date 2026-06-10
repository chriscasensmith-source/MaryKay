# R3 Tour Sign-Ups

A dead-simple tour volunteer sign-up app — a friendlier replacement for SignUpGenius.

- **Guides (volunteers)** open a shared link, tap a tour, enter name + email, done.
  No accounts. They get a confirmation email with a personal cancel link, and a
  reminder email 24 hours before their tour. Spanish tours show a gold "Español"
  badge and their confirmation/reminder emails are sent in both Spanish and English.
- **The organizer** manages everything from `/admin` (protected by a passcode) with
  quick inline forms: create/edit/cancel tour slots (title, date, time, language,
  guides needed, expected group size, notes), see and remove signups, and copy the
  public signup link for email blasts. Cancelling a tour automatically emails
  everyone who signed up; changing a tour's date or time does too.

**Stack:** Next.js (App Router) · Prisma · PostgreSQL (Neon) · Tailwind CSS · Resend · node-cron

## Environment variables

| Variable | Required | What it does |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string from Neon (use the pooled URL, with `?sslmode=require`) |
| `ADMIN_PASSCODE` | yes | Passcode for the `/admin` page — pick something private |
| `RESEND_API_KEY` | yes (for email) | API key from [resend.com](https://resend.com). Without it, the app still works but skips sending email (logged to console) |
| `APP_URL` | yes | Public URL of the app, used to build links in emails, e.g. `https://r3-tours.onrender.com` (no trailing slash) |
| `RESEND_FROM` | recommended | From address for emails, e.g. `R3 Tour Team <tours@yourdomain.com>`. The domain must be verified in Resend. If unset, falls back to Resend's test sender, which only delivers to your own Resend account email |
| `TZ` | recommended | Timezone tour times are entered/displayed in, e.g. `America/Chicago`. Set this on Render too — otherwise the server assumes UTC |

## Run locally

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment** — copy the example file and fill it in:

   ```bash
   cp .env.example .env
   ```

   At minimum set `DATABASE_URL` (from Neon) and `ADMIN_PASSCODE`.

3. **Create the database tables and seed example slots**

   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

   The seed adds 3 example tour slots — English, Spanish, and Bilingual (it
   skips itself if slots already exist).

4. **Start the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) for the volunteer page and
   [http://localhost:3000/admin](http://localhost:3000/admin) for the organizer page.

## Deploy to Render (from GitHub)

1. **Push this repo to GitHub** (you've likely already done this).

2. **Create the database on Neon** ([neon.tech](https://neon.tech)) and copy the
   connection string (the pooled one is fine).

3. **In the [Render dashboard](https://dashboard.render.com):**
   - Click **New → Web Service** and connect this GitHub repo.
   - **Runtime:** Node
   - **Build Command:**

     ```bash
     npm install && npx prisma migrate deploy && npm run build
     ```

   - **Start Command:**

     ```bash
     npm run start
     ```

4. **Add environment variables** (Environment tab): `DATABASE_URL`,
   `ADMIN_PASSCODE`, `RESEND_API_KEY`, `RESEND_FROM`, `TZ`, and `APP_URL`
   set to your Render URL (e.g. `https://r3-tours.onrender.com` — you can add
   this one after the first deploy when you know the URL, then redeploy).

5. **Deploy.** The build command runs the database migration automatically on
   every deploy, so schema changes ship themselves.

6. **Seed the example slots** (one time): open the service's **Shell** tab on
   Render and run `npm run db:seed`. Or run it locally with your `.env`
   pointing at the same Neon database.

> **Important:** use a Render **Web Service** (not a free static site), and note
> that on Render's free tier the service spins down when idle — which would stop
> the hourly reminder cron. Use a paid instance (Starter) so the server stays up
> and reminders go out on time.

## How reminders work

A `node-cron` job inside the app (started from `src/instrumentation.ts` when the
server boots) runs at the top of every hour. It finds active tour slots starting
within the next 24 hours that haven't had reminders sent, and emails every
signed-up volunteer. Each slot is marked so reminders only ever go out once.

## Project layout

```
prisma/schema.prisma        Database schema (Slot, Signup)
prisma/seed.js              Example data
src/instrumentation.ts      Starts the hourly reminder cron on boot
src/lib/                    Prisma client, email sending, auth, reminders
src/app/page.tsx            Public list of upcoming tours
src/app/signup/[slotId]/    Signup form
src/app/s/[token]/          Confirmation + self-service cancel page
src/app/admin/              Organizer dashboard (passcode-protected)
```
