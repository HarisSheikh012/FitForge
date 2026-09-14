<div align="center">

# FitForge

**Multi-Tenant Gym Management Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169e1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?logo=docker&logoColor=white)](https://www.docker.com/)

A production-oriented, multi-tenant gym management SaaS built with React, Node.js, PostgreSQL, Prisma, and Docker. Designed to manage members, memberships, trainers, classes, attendance, payments, analytics, and full gym operations across isolated gym tenants.

[API Docs](http://localhost:4000/api/docs) · [Health Check](http://localhost:4000/api/health) · [GitHub](https://github.com/HarisSheikh012/fitforge)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Local Development Setup](#local-development-setup)
- [Environment Configuration](#environment-configuration)
- [Docker Setup](#docker-setup)
- [API Documentation](#api-documentation)
- [Demo Credentials](#demo-credentials)
- [Security](#security)
- [Roadmap](#roadmap)
- [Author](#author)
- [License](#license)

---

## Overview

FitForge is a multi-tenant SaaS platform where each gym operates as a fully isolated tenant. A single deployment supports multiple gym businesses simultaneously — each with their own members, staff, plans, billing, and analytics — while sharing the same infrastructure.

The platform was designed with a production-oriented architecture from the ground up: layered backend (Controllers → Services → Repositories → Prisma), role-based access control, JWT token rotation, structured logging, rate limiting, and containerized deployment.

---

## Key Features

### Platform & Infrastructure
- **Multi-Tenant Architecture** — Every database record is scoped to a `gymId`. All queries enforce tenant isolation at the repository layer. Super Admins can query across all tenants.
- **5 Role Types** — `SUPER_ADMIN`, `GYM_OWNER`, `STAFF`, `TRAINER`, `MEMBER` with granular RBAC middleware
- **JWT Authentication** — Short-lived access tokens (15m) + long-lived refresh tokens (7d) stored in HttpOnly cookies with rotation on every refresh
- **2FA / TOTP** — Time-based One-Time Password support via `otplib`
- **Dark / Light Mode** — User-preferred theme with persistence
- **Mobile Responsive** — Fully responsive UI across all screen sizes

### Gym Management
- Create and manage multiple gyms and branches
- Operating hours configuration per day of week
- Logo upload and gallery management
- Equipment inventory with maintenance scheduling

### Member Management
- Full member profiles with photo, emergency contacts, and medical notes
- QR Code and barcode check-in / check-out
- Membership freeze, renewal, and historical record
- Trainer assignment and progress tracking
- Automated member ID generation

### Trainer & Staff Management
- Trainer profiles with specializations, certifications, and salary management
- Staff roles with department and position tracking
- Attendance tracking for all personnel

### Membership Plans & Payments
- Flexible plans: monthly, quarterly, half-yearly, yearly, and custom durations
- Coupon and discount system with expiry and usage limits
- Payment methods: Cash, Card, Bank Transfer, Online
- Invoice and receipt generation
- Refund handling
- **Stripe integration** *(placeholder — billing routes exist but Stripe webhooks and full billing flow are not production-complete)*

### Classes & Scheduling
- Class types: Yoga, CrossFit, Cardio, HIIT, Pilates, Weightlifting, and more
- Booking system with capacity limits and waiting list support
- Trainer-linked class schedules

### Reporting & Analytics
- Revenue, Attendance, and Membership Growth charts
- Trainer performance metrics
- Interactive dashboard with real-time statistics
- Export capabilities (groundwork in place)

### SaaS Subscription Tiers
- Free Trial, Basic, Pro, and Enterprise plan structure
- Usage limits per plan (max members, branches, trainers, staff)
- Subscription status management and expiry handling

---

## Architecture

### Request Flow

```mermaid
graph TD
    Client["React Client (Vite)"]
    Nginx["Nginx Reverse Proxy (prod)"]
    API["Express API (Port 4000)"]
    Auth["Auth Middleware (JWT)"]
    RBAC["RBAC Middleware (role check)"]
    Controller["Controller Layer"]
    Service["Service Layer (business logic)"]
    Repository["Repository Layer (data access)"]
    Prisma["Prisma ORM"]
    DB["PostgreSQL 16"]

    Client --> Nginx
    Nginx --> API
    API --> Auth
    Auth --> RBAC
    RBAC --> Controller
    Controller --> Service
    Service --> Repository
    Repository --> Prisma
    Prisma --> DB
```

### Multi-Tenancy

Tenant isolation is enforced via a `gymId` foreign key present on every domain table (`Member`, `Trainer`, `Staff`, `Subscription`, `Payment`, `Attendance`, `Class`, `Equipment`, etc.). The authenticated user's `gymId` is extracted from their JWT payload and injected into all repository-layer queries. `SUPER_ADMIN` users are exempt from this scoping and can operate across all tenants.

> **Note:** Tenant isolation currently depends on application-layer enforcement via the RBAC/service layer. Row-Level Security (RLS) at the PostgreSQL level is an identified improvement for the roadmap.

### Authentication & RBAC

- **Access Token**: Stateless JWT, 15-minute expiry, carries `userId`, `role`, `gymId`
- **Refresh Token**: 7-day expiry, stored in an HttpOnly cookie and in the database, rotated on every use. Old tokens are invalidated on rotation.
- **RBAC**: Role and permission checks are applied as Express middleware before requests reach controllers. The permission check is role-based and routes define which roles are permitted.

### Backend Layer Pattern

```
Controllers  — Parse request, validate input, call service, return HTTP response
Services     — Business logic, orchestration, cross-entity operations
Repositories — Data access only; all Prisma queries live here
Prisma ORM   — Type-safe database client, migrations, schema management
```

### Frontend Data Layer

- **TanStack Query (React Query v5)** — Server state management, caching, background refetching
- **Axios** — HTTP client with interceptors for token attachment and 401 handling
- **React Hook Form + Zod** — Form state and schema-based validation
- **React Router v6** — Client-side routing with protected route wrappers

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 19, Vite, TypeScript |
| **UI & Styling** | Tailwind CSS, shadcn/ui (Radix UI primitives), Lucide Icons |
| **Animations** | Framer Motion |
| **Data Fetching** | TanStack Query v5 (React Query) |
| **Forms & Validation** | React Hook Form, Zod |
| **Charts** | Recharts |
| **HTTP Client** | Axios |
| **Backend Framework** | Node.js, Express.js, TypeScript |
| **ORM** | Prisma ORM |
| **Database** | PostgreSQL 16 |
| **Authentication** | JWT (`jsonwebtoken`), bcrypt, TOTP (`otplib`) |
| **File Uploads** | Multer (local disk; S3-swappable) |
| **Email** | Nodemailer (SMTP) |
| **QR Codes** | `qrcode`, `qrcode.react` |
| **Payments** | Stripe SDK *(placeholder integration)* |
| **API Documentation** | Swagger / OpenAPI 3.0 (`swagger-jsdoc`, `swagger-ui-express`) |
| **Logging** | Winston |
| **Security** | Helmet, express-rate-limit, CORS |
| **Containerization** | Docker, Docker Compose |
| **Reverse Proxy** | Nginx (production) |

---

## Project Structure

```
fitforge/
├── backend/                        # Express + TypeScript API
│   ├── prisma/
│   │   ├── schema.prisma           # Full database schema (all models)
│   │   ├── seed.ts                 # Demo seed data
│   │   └── migrations/             # Prisma migration history
│   └── src/
│       ├── config/                 # App config, Swagger spec, DB client
│       │   ├── index.ts            # Centralised env config object
│       │   ├── database.ts         # Prisma client singleton
│       │   └── swagger.ts          # OpenAPI spec definition
│       ├── controllers/            # HTTP request/response handlers
│       ├── middleware/             # Auth, RBAC, rate limiting, error handling
│       ├── routes/                 # Express route definitions
│       ├── services/               # Business logic layer
│       ├── utils/                  # Logger, AppError, helpers
│       ├── validators/             # Zod validation schemas
│       ├── app.ts                  # Express app setup, middleware chain
│       └── server.ts              # HTTP server bootstrap, graceful shutdown
│
├── frontend/                       # React 19 + Vite + TypeScript
│   ├── index.html                  # Entry HTML with meta tags
│   └── src/
│       ├── assets/                 # Static assets (logo, icons)
│       ├── components/
│       │   ├── ui/                 # shadcn/ui base components
│       │   └── shared/             # App-level components (Sidebar, TopNav, etc.)
│       ├── context/                # React context providers (Auth, Theme)
│       ├── layouts/                # AuthLayout, DashboardLayout wrappers
│       ├── lib/                    # Axios instance, QueryClient setup
│       ├── pages/                  # Feature pages by domain
│       │   ├── auth/               # Login, register, reset password
│       │   ├── dashboard/          # Analytics dashboard
│       │   ├── members/            # Member management
│       │   ├── trainers/           # Trainer management
│       │   ├── staff/              # Staff management
│       │   ├── attendance/         # Attendance tracking & QR check-in
│       │   ├── classes/            # Class scheduling
│       │   ├── plans/              # Membership plan management
│       │   ├── payments/           # Payments & invoices
│       │   ├── equipment/          # Equipment inventory
│       │   ├── reports/            # Analytics & reporting
│       │   ├── settings/           # Profile & gym settings
│       │   └── notifications/      # Notification center
│       ├── routes/                 # React Router config, protected routes
│       └── utils/                  # Formatters, date helpers
│
├── nginx/
│   └── nginx.conf                  # Nginx reverse proxy config (production)
│
├── docker-compose.yml              # Development Docker Compose
├── docker-compose.prod.yml         # Production Docker Compose
├── .gitignore
└── README.md
```

---

## Local Development Setup

### Prerequisites

- **Node.js** ≥ 20
- **Docker** and **Docker Compose** (recommended)
- **PostgreSQL 16** (or use the Docker Compose database service)

### 1. Clone the Repository

```bash
git clone https://github.com/HarisSheikh012/fitforge.git
cd fitforge
```

### 2. Install Dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Configure Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` with your local PostgreSQL credentials and any other required values. See [Environment Configuration](#environment-configuration) for a full reference.

### 4. Set Up the Database

```bash
cd backend

# Run all Prisma migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed the database with demo data
npm run db:seed
```

### 5. Start the Development Servers

**Option A — Manual (two terminals):**

```bash
# Terminal 1 — Backend (http://localhost:4000)
cd backend && npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend && npm run dev
```

**Option B — Docker Compose (recommended):**

```bash
docker compose up -d
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Other Useful Commands

```bash
# Backend
npm run db:studio          # Open Prisma Studio (database GUI)
npm run db:reset           # Reset database and re-seed
npm run db:migrate:prod    # Run migrations in production mode
npm run build              # Compile TypeScript

# Frontend
npm run build              # Production build
npm run preview            # Preview production build locally
```

---

## Environment Configuration

### Backend — `backend/.env`

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | API server port | `4000` |
| `APP_NAME` | Application name | `FitForge` |
| `APP_URL` | Backend base URL | `http://localhost:4000` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/fitforge_db` |
| `JWT_ACCESS_SECRET` | Access token signing secret (≥32 chars) | *(generate securely)* |
| `JWT_REFRESH_SECRET` | Refresh token signing secret (≥32 chars) | *(generate securely)* |
| `JWT_ACCESS_EXPIRY` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token TTL | `7d` |
| `EMAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | SMTP username | `your_email@gmail.com` |
| `EMAIL_PASS` | SMTP password / app password | *(app password)* |
| `EMAIL_FROM` | Sender display name + address | `FitForge <noreply@fitforge.io>` |
| `STRIPE_SECRET_KEY` | Stripe secret key *(placeholder)* | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret *(placeholder)* | `whsec_...` |
| `OTP_ISSUER` | 2FA issuer name shown in authenticator apps | `FitForge` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | `900000` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |
| `LOG_LEVEL` | Winston log level | `debug` |

Copy `backend/.env.example` to `backend/.env` and fill in your values. **Never commit `.env` files.**

### Frontend — `frontend/.env`

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:4000/api` |

---

## Docker Setup

### Development

```bash
# Start all services (PostgreSQL, backend, frontend)
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Stop and remove volumes (full reset)
docker compose down -v
```

Services started by `docker-compose.yml`:

| Service | Container | Port |
|---------|-----------|------|
| PostgreSQL 16 | `fitforge_postgres` | `5432` |
| Express API | `fitforge_backend` | `4000` |
| React/Vite | `fitforge_frontend` | `5173` |

### Production

```bash
# Build and start production services
docker compose -f docker-compose.prod.yml up -d --build
```

The production compose file adds an Nginx reverse proxy container and uses multi-stage Docker builds for optimised image sizes. Set all required environment variables via your hosting platform's secrets manager or a `.env` file that is **never committed to version control**.

---

## API Documentation

After starting the backend server, the Swagger UI is available at:

- **Swagger UI**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- **Health Check**: [http://localhost:4000/api/health](http://localhost:4000/api/health)

### API Modules

| Module | Base Path | Description |
|--------|-----------|-------------|
| Auth | `/api/auth` | Login, register, token refresh, 2FA, password reset |
| Dashboard | `/api/dashboard` | Aggregated stats for the current gym |
| Gyms | `/api/gyms` | Gym CRUD, settings, operating hours |
| Branches | `/api/branches` | Branch management |
| Members | `/api/members` | Member profiles, QR check-in |
| Trainers | `/api/trainers` | Trainer profiles and assignments |
| Staff | `/api/staff` | Staff management |
| Memberships | `/api/memberships` | Membership plan CRUD |
| Attendance | `/api/attendance` | Check-in/check-out records |
| Payments | `/api/payments` | Payment records and billing |
| Invoices | `/api/invoices` | Invoice generation |
| Classes | `/api/classes` | Class scheduling and bookings |
| Equipment | `/api/equipment` | Equipment inventory |
| Reports | `/api/reports` | Analytics and reporting |
| Notifications | `/api/notifications` | In-app notifications |
| Subscriptions | `/api/subscriptions` | SaaS gym subscription management |
| Uploads | `/api/upload` | File upload endpoints |

---

## Demo Credentials

> [!IMPORTANT]
> These credentials are generated by the development seed script (`npm run db:seed`) and are **intended only for local demonstration**. Never use these credentials in a production environment.

Run the seed script first:

```bash
cd backend && npm run db:seed
```

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@gymapp.com` | `Admin@123!` |
| Gym Owner | `owner@fitlife.com` | `Owner@123!` |
| Staff | `staff@fitlife.com` | `Staff@123!` |
| Trainer | `trainer@fitlife.com` | `Trainer@123!` |
| Member | `member@fitlife.com` | `Member@123!` |

The seed also creates: a demo gym (FitLife Gym), membership plans, 5 sample members, a trainer, a staff member, sample classes, equipment, and attendance records.

---

## Screenshots

> Screenshots and a live demo GIF will be added after the first deployment.

---

## Security

### What Is Implemented
- **Helmet** — Sets secure HTTP headers on every response
- **CORS** — Restricted to the configured `FRONTEND_URL`
- **Rate Limiting** — Applied to all `/api/` routes via `express-rate-limit`
- **JWT Rotation** — Refresh tokens are invalidated on use and replaced
- **HttpOnly Cookies** — Refresh tokens are not accessible to JavaScript
- **Password Hashing** — bcrypt with a work factor of 12
- **Input Validation** — Zod schemas on all incoming request bodies
- **Tenant Scoping** — All queries are filtered by the authenticated user's `gymId`

### Known Limitations & Future Improvements
- **Row-Level Security**: Tenant isolation is enforced at the application layer only. Adding PostgreSQL RLS policies would provide a second layer of defence.
- **Email Verification Flow**: The token is generated and logged to console; the actual SMTP dispatch is stubbed with a `TODO` comment.
- **Stripe Billing**: The Stripe SDK is installed and the secret key is configurable, but the full billing/webhook flow is not production-complete.
- **Audit Logging**: No persistent audit log of admin actions yet.
- **Test Coverage**: Unit and integration tests are scaffolded (Jest is configured) but test files are not yet populated.

---

## Roadmap

Planned features and improvements for future releases:

- **AI-Powered Insights** — Member churn prediction, attendance pattern analysis, and personalised workout recommendations using an LLM integration (e.g., Gemini API or OpenAI)
- **AI Chatbot** — Embedded support assistant for gym staff powered by a retrieval-augmented generation (RAG) pipeline
- **Stripe Billing** — Complete SaaS billing flow: subscription creation, plan upgrades, prorations, and webhook handling
- **Email Delivery** — Complete the email service integration for verification emails, payment receipts, and renewal reminders
- **Push Notifications** — Mobile push and browser push notification support
- **Mobile App** — React Native companion app for members and trainers
- **Row-Level Security** — PostgreSQL RLS policies for additional tenant isolation
- **CI/CD Pipeline** — GitHub Actions workflows for automated testing and deployment
- **Test Suite** — Unit tests for services and integration tests for API endpoints
- **Export** — PDF and Excel export for reports and invoices
- **Audit Log** — Persistent, tamper-evident log of administrative actions

---

## Author

**FitForge** is designed and developed by **Haris Babar**, a Software Engineering graduate focused on backend systems, full-stack development, cloud infrastructure, and AI integration.

- **GitHub**: [github.com/HarisSheikh012](https://github.com/HarisSheikh012)

---

## License

MIT License © 2026 Haris Babar

See [LICENSE](./LICENSE) for the full license text.
