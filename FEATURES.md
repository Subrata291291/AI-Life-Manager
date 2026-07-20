# AI Life Manager — Feature Documentation

**Live App:** https://ai-life-manager.netlify.app/  
**Version:** 1.1.0  
**Architecture:** React 19 SPA (Netlify) + WordPress REST API Plugin

---

## 1. Architecture Overview

```
Frontend (React SPA on Netlify)
         │
         │  Axios → https://salujaautomobile.com/ai-life-manager/wp-json/alm/v1/*
         │  Header: X-ALM-User-ID (from localStorage)
         │
         ▼
WordPress Backend
         │
         ├── REST API (alm/v1) ─── 20+ endpoints
         ├── Custom DB Tables ───── 5 tables (tasks, expenses, bills, goals, notifications)
         ├── WP Admin ───────────── Razorpay config + manual subscription management
         └── Cron ──────────────── Daily subscription sync with Razorpay
```

---

## 2. Subscription Plans

| Tier | Name | Price (Monthly) | Features |
|------|------|-----------------|----------|
| 0 | **Free** | ₹0 | Task management only |
| 1 | **Tasks** | ₹499 | Task management |
| 2 | **Essential** | ₹999 | Tasks + Expense tracking |
| 3 | **Premium** | ₹1,499 | Tasks + Expenses + Bills + Goals |

- **Recurring billing** via Razorpay subscriptions (24-month cycle, auto-renew)
- **No webhooks required** — daily cron syncs subscription status with Razorpay API
- **Manual override** — admin can set any user's tier/status/expiry from WP Admin

---

## 3. Features

### 3.1 Task Management
- Create, edit, delete tasks
- Set priority (Low / Medium / High)
- Schedule start date-time & end date-time
- Status tracking: Upcoming → In Progress → Completed / Overdue
- Duration auto-calculated
- Dashboard: recent tasks, completion rate KPI

### 3.2 Expense Tracking
- Create, edit, delete expenses
- Categories: Food, Travel, Shopping, Bills, Health, Education
- Notes field for each expense
- Filter by: category, date range, notes search
- Charts: monthly spending bar chart, category breakdown pie chart
- Dashboard: total expenses KPI, spending trend, expense breakdown

### 3.3 Bill Management
- Create, edit, delete bills
- Recurring options: One-time, Monthly, Quarterly, Yearly
- Due date tracking with smart display: Paid, Upcoming, Due Today, Overdue
- Mark as paid
- Filter by: name search, status
- Dashboard: upcoming bills panel

### 3.4 Goal Setting
- Create, edit, delete financial goals
- Target amount & current amount with progress bar
- Target date with days remaining countdown
- "Add Money" to increment progress
- Status tracking: Started → In Progress → Completed
- Dashboard: active goals panel

### 3.5 Dashboard
- 4 KPI cards: Total Tasks, Completion Rate, Total Expenses, Active Goals
- Monthly expense bar chart
- Expense category pie chart
- AI Insights panel (spending + task + bill recommendations)
- Recent tasks, upcoming bills, active goals panels

### 3.6 Notifications
- Auto-generated when tasks are created (15 minutes before start time)
- Auto-generated for bills due within 3 days
- Expired bill notifications auto-cleaned
- Mark as read / delete
- Bell icon with unread badge count
- Auto-fetches every 60 seconds

### 3.7 Authentication & User Management
- Register with name, email, password
- Email verification (token-based, verification link sent via `wp_mail`)
- Login with email + password
- Forgot password / reset password (1-hour token expiry)
- WordPress cookie-based session management

### 3.8 Theme
- Light / Dark mode toggle
- Persisted in localStorage
- Respects system color scheme preference on first visit

---

## 4. API Endpoints

All routes under namespace `alm/v1`. Base: `{site}/wp-json/alm/v1`

### Authentication
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/ping` | Health check + diagnostic headers |
| GET | `/health` | Simple health check |
| POST | `/auth/register` | Create account + send verification email |
| POST | `/auth/login` | Log in (returns user + subscription data) |
| POST | `/auth/verify-email` | Verify email via token |
| POST | `/auth/forgot-password` | Send password reset email |
| POST | `/auth/reset-password` | Reset password via token |
| GET | `/auth/me` | Get current user (WP cookie auth) |

### Tasks (gated: Tasks tier+)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/tasks` | List all tasks |
| POST | `/tasks` | Create task |
| PUT | `/tasks/{id}` | Update task |
| DELETE | `/tasks/{id}` | Delete task |
| POST | `/tasks/status` | Update task status |

### Expenses (gated: Essential tier+)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/expenses` | List expenses (with filters) |
| POST | `/expenses` | Create expense |
| PUT | `/expenses` | Update expense |
| DELETE | `/expenses/{id}` | Delete expense |

### Bills (gated: Premium tier)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/bills` | List bills (with filters) |
| POST | `/bills` | Create bill |
| PUT | `/bills` | Update bill |
| DELETE | `/bills/{id}` | Delete bill |
| PUT | `/bills/{id}/paid` | Mark bill as paid |

### Goals (gated: Premium tier)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/goals` | List goals (with search) |
| POST | `/goals` | Create goal |
| PUT | `/goals` | Update goal |
| DELETE | `/goals/{id}` | Delete goal |
| POST | `/goals/add-money` | Add money to goal progress |

### Dashboard & Notifications
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/dashboard` | Aggregated stats (feature-aware) |
| GET | `/notifications` | List notifications |
| POST | `/notifications/read` | Mark notification as read |
| DELETE | `/notifications/{id}` | Delete notification |

### Subscription & Payments
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/subscription/status` | Get current tier, status, expiry |
| GET | `/subscription/plans` | Get available plans & prices |
| POST | `/subscription/create-subscription` | Create Razorpay subscription |
| POST | `/subscription/verify` | Verify payment & activate |

---

## 5. Database Schema

5 custom tables in WordPress (`wp_` prefix):

### `wp_alm_tasks`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK AUTO_INCREMENT | |
| user_id | BIGINT(20) | Indexed |
| title | VARCHAR(255) | |
| description | TEXT | |
| start_time | DATETIME | |
| end_time | DATETIME | |
| priority | VARCHAR(20) | low/medium/high |
| status | VARCHAR(20) | upcoming/in_progress/completed/overdue |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### `wp_alm_expenses`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK AUTO_INCREMENT | |
| user_id | BIGINT(20) | Indexed |
| amount | DECIMAL(12,2) | |
| category | VARCHAR(50) | |
| note | TEXT | |
| expense_date | DATE | |
| created_at | DATETIME | |

### `wp_alm_bills`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK AUTO_INCREMENT | |
| user_id | BIGINT(20) | Indexed |
| bill_name | VARCHAR(255) | |
| amount | DECIMAL(12,2) | |
| due_date | DATE | |
| recurring | VARCHAR(20) | monthly/quarterly/yearly/one-time |
| reminder_days | INT | |
| status | VARCHAR(20) | paid/unpaid |
| created_at | DATETIME | |

### `wp_alm_goals`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK AUTO_INCREMENT | |
| user_id | BIGINT(20) | Indexed |
| goal_name | VARCHAR(255) | |
| target_amount | DECIMAL(12,2) | |
| current_amount | DECIMAL(12,2) | |
| target_date | DATE | |
| created_at | DATETIME | |

### `wp_alm_notifications`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK AUTO_INCREMENT | |
| user_id | BIGINT(20) | Indexed |
| task_id | INT | Nullable FK |
| title | VARCHAR(255) | |
| message | TEXT | |
| type | VARCHAR(50) | |
| status | VARCHAR(20) | unread/read |
| created_at | DATETIME | |

---

## 6. Payment Integration (Razorpay)

**Flow:**
1. User selects plan → frontend calls `POST /subscription/create-subscription`
2. Backend creates a monthly plan on Razorpay (or reuses existing one)
3. Backend creates a 24-month subscription on Razorpay
4. Frontend opens Razorpay checkout with `subscription_id`
5. User completes payment in Razorpay popup
6. Frontend calls `POST /subscription/verify` with payment signature
7. Backend verifies HMAC SHA256 signature → activates subscription (30-day expiry)
8. Daily cron syncs subscription status with Razorpay API
9. Each monthly payment auto-extends expiry by 30 days

**Admin Config (WP Admin → AI Life Manager):**
- Razorpay Key ID
- Razorpay Key Secret
- Frontend URL (for email verification links)
- Test Razorpay Connection button
- Reset Stored Plans button
- Manual user subscription management

---

## 7. Technology Stack

### Frontend
- **React 19** with TypeScript
- **Vite 8** build tool
- **React Router v7** (client-side routing)
- **Axios** (HTTP client)
- **Bootstrap 5** + **React-Bootstrap** (UI framework)
- **Recharts** (charts: bar, pie, donut)
- **SweetAlert2** (modals, confirmations, alerts)
- **Lucide React** (icons)

### Backend
- **WordPress** plugin (PHP)
- **MySQL** (5 custom tables)
- **REST API** (WordPress REST API framework)
- **Razorpay API** (payment gateway)
- **wp_mail()** (email: verification, password reset)

### DevOps
- **Netlify** (frontend hosting)
- **Apache / cPanel** (WordPress hosting)

---

## 8. Key Security Features

- **Email verification** required before login
- **Password hashing** via WordPress (`wp_hash_password`)
- **Forgot password** with 1-hour token expiry
- **Feature gating** on both frontend (UI) and backend (API)
- **Payment signature verification** (HMAC SHA256)
- **CORS headers** configured for cross-origin requests
- **Input sanitization** on all API endpoints
- **SQL injection prevention** via `$wpdb->prepare()`

---

## 9. WordPress Admin Panel

### AI Life Manager (Settings)
- Razorpay Key ID / Key Secret
- Frontend URL (for email links)
- Test Razorpay Connection
- Reset Stored Plans

### AI Life Manager → Subscriptions
- List all WordPress users
- View current tier, status, expiry for each user
- Manually set any user's subscription tier (Free/Tasks/Essential/Premium)
- Set subscription status (Active/Inactive/Expired)
- Set custom expiry date

---

## 10. Deployment

### Frontend (Netlify)
```bash
npm run build    # Type-check + production build
# Deploy dist/ folder to Netlify
```

### Environment Variables (Netlify)
| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | WordPress REST API base URL (optional — default is hardcoded) |

### Backend (WordPress)
- Upload `plugin-work/ai-life-manager-with-subscription/` to `wp-content/plugins/ai-life-manager/`
- Activate plugin → auto-creates 5 database tables
- Configure in WP Admin → AI Life Manager

---

*Document generated July 2026*
