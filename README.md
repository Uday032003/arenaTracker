# Personal Activity & Memory Tracker

A production-ready, full-stack Personal Activity & Memory Tracker application built with React, Node.js, Express, and PostgreSQL (with managed Supabase connection support).

This application allows users to create reusable item templates, record individual occurrences against those items, track when something last happened, measure activity durations with live persisted timers, log visited locations during rides and trips, save communications, and review chronological history and rich database-backed analytics.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React with Vite (using pure JavaScript `.js` components).
- **Styling**: Plain CSS design system (`theme.css`, `global.css`) inspired by the Supabase dark mode aesthetic (near-black charcoal backgrounds, `#3ecf8e` green accents, subtle borders, rounded cards).
- **Routing**: React Router (`react-router-dom`).
- **HTTP Client**: Native Fetch API with `credentials: 'include'` (`client/src/services/api.js`). Zero external HTTP clients (no Axios).
- **Icons**: Lucide React (`lucide-react`).
- **Analytics**: Recharts (`recharts`).

### Backend
- **Runtime & Server**: Node.js & Express.js (ES Modules, `.js` only).
- **Database**: PostgreSQL with connection pooling via `pg.Pool`, SQL migrations, UUID primary keys, foreign keys, and indexes.
- **Validation**: Zod schema validation on all inputs.
- **Security**: bcrypt password hashing, server-managed sessions stored in PostgreSQL `sessions` table, HTTP-only SameSite cookies, in-memory rate limiting, and strict ownership checks (`WHERE user_id = $1`).

---

## 🏗️ Architecture & Modules

```
arena/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Loader, Modal, ConfirmDialog, EmptyState, TrackingIcon
│   │   │   ├── items/          # ItemCard
│   │   │   ├── layout/         # AppShell, Sidebar, BottomNavigation, Header
│   │   │   └── sessions/       # ActiveTimerCard (live clock from timestamp)
│   │   ├── context/            # AuthContext (server-managed session state)
│   │   ├── pages/
│   │   │   ├── activities/     # ActivityFormPage, ActivityDetailsPage
│   │   │   ├── auth/           # LoginPage, SignupPage, ForgotPasswordPage, ResetPasswordPage
│   │   │   ├── history/        # HistoryPage (list & calendar date filter)
│   │   │   ├── insights/       # InsightsPage (Recharts analytics & metrics)
│   │   │   ├── items/          # ItemsListPage, ItemFormPage, ItemDetailsPage
│   │   │   ├── settings/       # SettingsPage (preferences, timezone, JSON export, deletion)
│   │   │   └── HomePage.js     # Home dashboard (stats, pinned items, active timers, timeline)
│   │   ├── services/           # api.js (native Fetch client)
│   │   └── styles/             # theme.css & global.css (vanilla CSS only)
│   ├── vite.config.js          # Configured to transform JSX in .js files
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/             # db.js (pg.Pool), env.js
│   │   ├── db/
│   │   │   ├── migrations/     # 001_initial_schema.sql
│   │   │   └── migrate.js      # Automatic SQL migration runner
│   │   ├── middleware/         # auth.js, errorHandler.js, rateLimit.js, validate.js
│   │   ├── modules/
│   │   │   ├── activities/     # Event occurrence logging & details
│   │   │   ├── auth/           # Signup, login, logout, password resets
│   │   │   ├── categories/     # Custom categories management
│   │   │   ├── dashboard/      # Home KPIs and recent activity feed
│   │   │   ├── favorites/      # Pinned items management
│   │   │   ├── insights/       # Real analytics queries & neglected habits
│   │   │   ├── items/          # Reusable item templates library
│   │   │   ├── places/         # Visited stops during rides/trips
│   │   │   ├── sessions/       # Active and completed timers
│   │   │   ├── settings/       # User profile, timezone, data export, deletion
│   │   │   └── variants/       # Sub-items and varieties
│   │   ├── routes/             # Central api.js router
│   │   ├── utils/              # dateUtils.js (time zone relative date calculations)
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/                  # Integration test suite (Vitest + Supertest)
│   └── package.json
├── scripts/
│   ├── dev.js                  # Concurrently launches backend & frontend
│   └── verify_user_journey.js  # Automated E2E verification script
└── package.json
```

---

## 🗄️ Database & Supabase Configuration

### Connecting to Supabase
In `server/.env`, replace `DATABASE_URL` with your Supabase PostgreSQL connection string:

```env
DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
```

The database pool (`server/src/config/db.js`) automatically activates SSL when connecting to Supabase or remote PostgreSQL hosts (`ssl: { rejectUnauthorized: false }`).

### Local PostgreSQL
For local development, the app connects to PostgreSQL:
```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/activity_tracker
```

---

## 🚀 Running the Application

### 1. Run Database Migrations
```bash
npm run migrate
```

### 2. Run in Development Mode
Starts both the Express API (http://localhost:5000) and the Vite frontend (http://localhost:5173):
```bash
npm run dev
```

Or run them individually:
```bash
npm run dev:server
npm run dev:client
```

### 3. Build for Production
Compiles all JSX in `.js` files and bundles assets into `client/dist`:
```bash
npm run build
```

---

## 🧪 Testing

### Backend Integration Tests (Vitest + Supertest)
Runs 28 comprehensive tests against real PostgreSQL checking:
- User signup, duplicate email prevention, invalid login, password reset
- Initial empty library (zero items)
- Item creation, reuse, duplicate name warnings, archiving, and deletion
- Sub-item variants (e.g. Dairy Milk, Perk under Chocolate)
- Timed sessions, start/stop, duration calculation, duplicate session prevention
- Trip places recording during rides
- Call communications (participant, incoming/outgoing, call duration)
- Cross-user data isolation

```bash
npm run test:server
```

### Frontend Component Tests (Vitest + React Testing Library)
```bash
npm run test:client
```

### End-to-End User Journey Verification
Executes all 15 steps specified in Section 25 of the specification:
```bash
node scripts/verify_user_journey.js
```
All 15 steps pass with 100% success.
