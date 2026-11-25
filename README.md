# ClubConnect — Full-Stack Student Club Engagement Platform

**Make campus life count.**

ClubConnect is a production-oriented full-stack web application built with React, TypeScript, Express, PostgreSQL, Prisma ORM, HTTP-only JWT cookie authentication, and Socket.IO real-time notifications.

---

## 1. Project Overview

ClubConnect helps university students discover campus clubs transparently, apply for roles, complete guided onboarding, manage shared responsibilities on Kanban boards, log and verify contributions, and register for events—while giving club presidents and officers a dedicated **President Portal** (`/president/*`) for member management, workload balancing, contribution verification, announcements, recruitment pipelines, and club analytics.

## 2. Technology Stack

- **Frontend (`client/`)**: React 18, Vite, TypeScript, Tailwind CSS v4, React Router DOM, TanStack Query, Axios, Framer Motion, Lucide React, Recharts, React Hook Form, Sonner, Socket.IO Client.
- **Backend (`server/`)**: Node.js, Express, TypeScript, PostgreSQL, Prisma ORM, Zod, JWT (`jsonwebtoken`), `bcryptjs`, `cookie-parser`, Helmet, CORS, `express-rate-limit`, Multer, Socket.IO.
- **Testing**: Vitest + Supertest against an isolated PostgreSQL test database (`clubconnect_test`).

## 3. Project Architecture

```text
├── client/                 # Vite + React + TypeScript frontend
│   └── src/
│       ├── components/     # Reusable UI, animations, Kanban, modals
│       ├── context/        # AuthContext (session restoration + Socket.IO)
│       ├── layouts/        # MainLayout & WorkspaceLayout
│       ├── pages/          # All public and protected application routes
│       ├── services/       # Typed Axios API client & feature services
│       ├── types/          # TypeScript interfaces
│       └── utils/          # Onboarding step copy
├── server/                 # Express + TypeScript + Prisma backend
│   ├── prisma/             # schema.prisma & SQL migrations
│   ├── src/
│   │   ├── config/         # env validation, Prisma singleton, CORS
│   │   ├── controllers/    # HTTP request handlers
│   │   ├── middleware/     # JWT auth, club RBAC, CSRF, Zod, Multer, errors
│   │   ├── routes/         # Express route definitions
│   │   ├── scripts/        # Super-admin bootstrap script
│   │   ├── services/       # Transactional business logic & analytics
│   │   ├── sockets/        # Authenticated Socket.IO notification server
│   │   ├── tests/          # Vitest + Supertest integration suite
│   │   ├── utils/          # AppError, apiResponse, JWT/hash helpers
│   │   └── validators/     # Zod request schemas
│   └── uploads/            # Uploaded user profile avatars
├── docs/API.md             # Complete API endpoint documentation
└── package.json            # npm workspaces root configuration
```

## 4. Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 16+

## 5. PostgreSQL Installation & Database Creation

On macOS with Homebrew:

```bash
brew install postgresql@16
brew services start postgresql@16
createdb clubconnect
createdb clubconnect_test
```

## 6. Environment Configuration

Copy the example environment files and configure your secrets:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env` with your PostgreSQL `DATABASE_URL`, `TEST_DATABASE_URL`, and strong random secrets for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `COOKIE_SECRET`.

## 7. Installation

From the repository root:

```bash
npm install
```

## 8. Prisma Migration Instructions

```bash
npm run db:generate
npm run db:migrate
```

To inspect tables in Prisma Studio:

```bash
npm run db:studio
```

## 9. Super-Admin Bootstrap

The database starts completely clean with no fake data. To create the initial `SUPER_ADMIN` user using environment variables or interactive prompts:

```bash
ADMIN_EMAIL="admin@campus.edu" ADMIN_NAME="Platform Admin" ADMIN_PASSWORD="StrongPassword123" npm run bootstrap:admin
```

Or run `npm run bootstrap:admin` to enter credentials interactively.

## 10. Running Locally

Start both backend (`http://localhost:5050`) and frontend (`http://localhost:5173`):

```bash
npm run dev
```

Or run individually:

```bash
npm run dev --workspace=server
npm run dev --workspace=client
```

## 11. Authentication Explanation

- Passwords are hashed with `bcryptjs` (12 salt rounds) and never returned in API responses.
- `/api/auth/login` and `/api/auth/register` set short-lived `accessToken` (15m) and rotating `refreshToken` (7d) in **HTTP-only cookies**, plus a double-submit `clubconnect_csrf` cookie validated via `X-CSRF-Token` on state-changing requests.
- Refresh tokens are SHA-256 hashed before storage in `RefreshToken`. Reuse of a revoked refresh token revokes all active tokens for that user.
- On page reload, the frontend restores sessions cleanly via `GET /api/auth/me` (and transparently refreshes via `POST /api/auth/refresh` when the access cookie expires).

## 12. Role & Permission Model

- **Global roles (`User.globalRole`)**: `STUDENT` (default for all registrations) and `SUPER_ADMIN`.
- **Club-scoped roles (`ClubMembership.role`)**: `MEMBER`, `PRESIDENT`, `VICE_PRESIDENT`, `SECRETARY`, `TREASURER`, `COORDINATOR`.
- A student can be a `MEMBER` in one club and `PRESIDENT` in another. Every sensitive endpoint enforces authorization on the backend (`assertClubRole` / `assertActiveClubMember`), preventing self-approval of applications, self-verification of contributions, and cross-club tampering.

## 13. API Documentation

See [docs/API.md](./docs/API.md) for the full endpoint reference and request/response formats.

## 14. Testing Instructions

Ensure `clubconnect_test` exists and has migrations applied (`DATABASE_URL="postgresql://USER@localhost:5432/clubconnect_test" npx --workspace=server prisma migrate deploy`), then run:

```bash
npm run test
```

## 15. Production Build & Deployment

```bash
npm run build
```

Set `NODE_ENV=production`, configure production `DATABASE_URL`, `CLIENT_URL`, strong secrets, and run `npm run db:migrate:deploy --workspace=server` followed by `npm run start --workspace=server` while serving `client/dist` via your static CDN or reverse proxy.
