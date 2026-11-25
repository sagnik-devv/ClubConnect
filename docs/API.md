# ClubConnect API Reference

Base URL: `/api`

All responses follow a consistent JSON envelope:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Error responses:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "Invalid email address" }]
}
```

## Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/auth/csrf` | Public | Issue `clubconnect_csrf` cookie and token |
| `POST` | `/api/auth/register` | Public | Register a new `STUDENT` account |
| `POST` | `/api/auth/login` | Public | Authenticate and set HTTP-only cookies |
| `POST` | `/api/auth/refresh` | Refresh Cookie | Rotate refresh token and issue new access cookie |
| `POST` | `/api/auth/logout` | Cookie | Revoke refresh token and clear cookies |
| `GET` | `/api/auth/me` | Required | Restore current user session and memberships |
| `PATCH` | `/api/auth/change-password` | Required | Update password and revoke active refresh tokens |

## Users & Profile (`/api/users`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/users/me` | Required | Get full profile, memberships, verified contributions |
| `PATCH` | `/api/users/me` | Required | Update name, bio, department, course, year, skills, interests |
| `PATCH` | `/api/users/me/password` | Required | Change password |
| `POST` | `/api/users/me/avatar` | Required | Upload profile image via Multer (`avatar` field) |
| `GET` | `/api/users/:id/public-profile` | Public | Public profile view (omits private email/tokens) |
| `GET` | `/api/users/me/applications` | Required | Current user's recruitment applications |
| `GET` | `/api/users/me/events` | Required | Current user's registered events |
| `GET` | `/api/users/:userId/contributions` | Required | Contributions scoped by authorization |

## Clubs & Memberships (`/api/clubs`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/clubs` | Public | Search, filter (`category`, `recruiting`, `interest`), sort, paginate |
| `GET` | `/api/clubs/:id` | Optional | Get club by ID or slug with leadership & member counts |
| `POST` | `/api/clubs` | Required | Create club and assign creator as `PRESIDENT` |
| `PATCH` | `/api/clubs/:id` | Club Leader | Update club profile |
| `DELETE` | `/api/clubs/:id` | President / Admin | Deactivate club |
| `GET` | `/api/clubs/:id/members` | Active Member | List active members |
| `GET` | `/api/clubs/:id/statistics` | Club Leader | Real member roster, workload, participation & leaderboard |
| `POST` | `/api/clubs/:id/join` | Required | Submit pending membership request |
| `POST` | `/api/clubs/:id/leave` | Active Member | Leave club (preserving historical tasks/contributions) |
| `GET` | `/api/clubs/:id/membership-requests` | Club Leader | List pending membership requests |
| `PATCH` | `/api/clubs/:id/membership-requests/:requestId` | Club Leader | Approve, reject, or update club role |

## Tasks (`/api/tasks` & `/api/clubs/:clubId/tasks`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/tasks` | Required | List tasks in user's active clubs with filters |
| `GET` | `/api/tasks/:id` | Club Member | Get task details and `TaskActivity` audit log |
| `POST` | `/api/tasks` | Club Leader | Create and assign task |
| `PATCH` | `/api/tasks/:id` | Club Leader | Update task fields |
| `DELETE` | `/api/tasks/:id` | Club Leader | Delete task |
| `PATCH` | `/api/tasks/:id/status` | Leader or Assignee | Update status and record `TaskActivity` |
| `PATCH` | `/api/tasks/:id/assign` | Club Leader | Assign/reassign task to active member |
| `GET` | `/api/tasks/:id/activity` | Club Member | Fetch task audit history |

## Contributions (`/api/contributions`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/contributions` | Required | List contributions visible to user |
| `GET` | `/api/contributions/:id` | Owner or Leader | Inspect single contribution |
| `POST` | `/api/contributions` | Active Member | Submit pending contribution |
| `PATCH` | `/api/contributions/:id` | Owner (Pending) | Edit pending contribution |
| `PATCH` | `/api/contributions/:id/verify` | Club Leader (not self) | Verify (award points) or reject submission |
| `GET` | `/api/clubs/:clubId/leaderboard` | Active Member | Verified contribution leaderboard |

## Recruitment (`/api/recruitment` & `/api/clubs/:clubId/applications`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/recruitment` | Required | Get `myApplications` and `manageableApplications` |
| `GET` | `/api/recruitment/:id` | Applicant or Leader | View application details |
| `POST` | `/api/clubs/:clubId/applications` | Required | Submit application (blocks duplicate pending) |
| `GET` | `/api/clubs/:clubId/applications` | Club Leader | List applications for a club |
| `PATCH` | `/api/recruitment/:id/status` | Club Leader (not self) | Update status; `ACCEPTED` creates active membership transactionally |
| `PATCH` | `/api/recruitment/:id/notes` | Club Leader | Save internal review notes |
| `PATCH` | `/api/recruitment/:id/onboarding` | Applicant or Leader | Update onboarding step (1–6) |

## Events (`/api/events`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/events` | Optional | List upcoming or past events |
| `GET` | `/api/events/:id` | Optional | Get single event details |
| `POST` | `/api/events` | Club Leader | Create event |
| `PATCH` | `/api/events/:id` | Club Leader | Update event |
| `DELETE` | `/api/events/:id` | Club Leader | Delete event |
| `POST` | `/api/events/:id/register` | Required | Register transactionally (enforces capacity & uniqueness) |
| `DELETE` | `/api/events/:id/register` | Required | Cancel registration |
| `GET` | `/api/events/:id/attendees` | Club Leader | View registered attendees |

## Notifications (`/api/notifications`) & Analytics (`/api/analytics`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | Required | List user's notifications (`all`, `unread`, `read`) |
| `GET` | `/api/notifications/unread-count` | Required | Get unread count |
| `PATCH` | `/api/notifications/:id/read` | Owner | Mark notification read/unread |
| `PATCH` | `/api/notifications/read-all` | Required | Mark all user notifications read |
| `DELETE` | `/api/notifications/:id` | Owner | Delete notification |
| `GET` | `/api/analytics/platform` | Public | Aggregate counts for homepage |
| `GET` | `/api/analytics/student` | Required | Real student dashboard metrics and weekly buckets |

## Announcements (`/api/announcements`) & President Portal (`/api/president`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/announcements` | Active Member | Feed of pinned & recent announcements across user's active clubs |
| `GET` | `/api/president/dashboard` | Club Leader | Scoped leadership overview, workload, engagement & activity feed |
| `GET` | `/api/president/clubs` | Club Leader | List authorized leadership clubs |
| `GET` | `/api/president/clubs/:clubId` | Club Leader | Authorized club details including points config |
| `GET` | `/api/president/clubs/:clubId/members` | Club Leader | Searchable/sortable roster with task & contribution metrics |
| `GET` | `/api/president/clubs/:clubId/members/:memberId` | Club Leader | Member deep-dive (tasks, contributions, events attended) |
| `PATCH` | `/api/president/clubs/:clubId/members/:memberId` | Club Leader | Update member role or remove member |
| `GET` | `/api/president/clubs/:clubId/membership-requests` | Club Leader | List pending join requests |
| `PATCH` | `/api/president/clubs/:clubId/membership-requests/:requestId` | Club Leader | Approve (`ACTIVE`) or reject (`REJECTED` with optional reason) |
| `GET` | `/api/president/clubs/:clubId/tasks` | Club Leader | Club tasks + workload distribution & suggested assignee |
| `POST` | `/api/president/clubs/:clubId/tasks` | Club Leader | Create and assign a task inside club |
| `GET` | `/api/president/clubs/:clubId/contributions` | Club Leader | List club contributions for review |
| `PATCH` | `/api/president/contributions/:contributionId/verify` | Club Leader (not self) | Verify (using configured points/override) or reject contribution |
| `GET` | `/api/president/clubs/:clubId/recruitment` | Club Leader | Club recruitment pipeline applications |
| `PATCH` | `/api/president/recruitment/:applicationId/status` | Club Leader (not self) | Transition application stage |
| `GET` | `/api/president/clubs/:clubId/events` | Club Leader | Club events including drafts |
| `POST` | `/api/president/clubs/:clubId/events` | Club Leader | Create club event |
| `GET` | `/api/president/clubs/:clubId/announcements` | Club Leader | List club announcements |
| `POST` | `/api/president/clubs/:clubId/announcements` | Club Leader | Publish announcement & notify active members |
| `PATCH` | `/api/president/announcements/:id` | Club Leader | Edit or toggle pin on announcement |
| `DELETE` | `/api/president/announcements/:id` | Club Leader | Delete announcement |
| `GET` | `/api/president/clubs/:clubId/analytics` | Club Leader | Range-filtered club engagement, task, contribution & recruitment analytics |
| `PATCH` | `/api/president/clubs/:clubId/settings` | Club Leader / President | Update profile, points config, transfer presidency, or archive club |
