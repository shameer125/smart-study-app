<div align="center">

# Smart Study — Planner + AI Assistant

**A premium, full-stack MERN study workspace with AI-powered learning, focus mode, calendar, notes, and task management.**

Built with the MERN stack — production-ready, modular, and beautiful out of the box.

</div>

---

## Stack

| Layer        | Tech                                                                        |
| ------------ | --------------------------------------------------------------------------- |
| Frontend     | React 18 (Vite) · Tailwind CSS · Framer Motion · React Router · Axios · Recharts · `@dnd-kit` · React Markdown |
| Backend      | Node.js · Express · MongoDB (Mongoose) · JWT · bcrypt · Multer · Helmet · Rate-limit |
| AI           | OpenAI SDK pointed at **OpenRouter** by default (FREE) — also works with OpenAI, Azure, Groq, etc. |
| Auth         | JWT (Bearer) + bcrypt + **email verification** + **forgot/reset password** (Nodemailer) |
| File uploads | Multer with disk storage (PDF, images, docs)                                |

## Features

### Core
- Premium dashboard UI (glassmorphism, gradients, soft shadows, Framer Motion animations)
- **Dashboard** — stats cards, weekly focus chart, subject pie chart, upcoming tasks, today's schedule
- **Task Manager** — board (drag & drop) + list views, priorities, statuses, deadlines, filters & search
- **Calendar / Study Planner** — month & week views, color-coded sessions, day detail panel
- **Notes Manager** — Markdown editor + viewer, file attachments (PDF/images/docs), tags, pin, color-coded
- **AI Assistant (Aria)** — ChatGPT-style chat, three modes (Chat / Explain / Summarize), conversation history, regenerate, markdown rendering
- **Focus Mode** — Pomodoro timer (25/5/15) with animated SVG ring, browser notifications, auto-logging
- **Profile & Settings** — avatar initials, edit bio, change password, configure pomodoro, theme switcher

### Premium polish
- Dark / Light mode (persisted, system-aware)
- Toast notifications (Framer Motion)
- Loading skeletons (shimmer)
- Responsive (mobile sidebar drawer)
- Modern fonts (Inter + Poppins)
- Sample data seed script

### Security
- JWT auth (Bearer tokens, 7-day expiry, configurable)
- bcrypt password hashing (10 rounds)
- **6-digit email verification on signup** (15 min TTL, attempt limit, 60s resend cooldown)
- **Forgot / Reset password** via 6-digit email codes
- Email-enumeration protection on forgot-password
- Protected routes (frontend + backend middleware)
- Express Validator input validation
- Helmet security headers
- Rate limiting (500 req / 15 min per IP)
- File-type whitelist + 15 MB upload limit

---

## Folder structure

```
smart-study/
├── backend/
│   ├── config/db.js
│   ├── controllers/   # auth, task, note, schedule, ai, stats
│   ├── middleware/    # auth (JWT), upload (multer), errorHandler, asyncHandler
│   ├── models/        # User, Task, Note, Schedule, ChatMessage, FocusSession
│   ├── routes/        # one file per resource
│   ├── utils/         # generateToken.js, seed.js
│   ├── uploads/       # multer file storage (gitignored)
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── layout/   # Sidebar, Topbar, DashboardLayout
    │   │   ├── ui/       # Button, Input, Modal, Skeleton, EmptyState, PageHeader
    │   │   └── common/   # ProtectedRoute
    │   ├── context/      # AuthContext, ThemeContext, ToastContext
    │   ├── pages/        # Login, Register, Dashboard, Tasks, Calendar, Notes, AIAssistant, FocusMode, Profile, Settings
    │   ├── services/     # api.js + one file per resource
    │   ├── utils/helpers.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## Quick start

### Prerequisites

- Node.js **18+**
- MongoDB running locally (`mongodb://localhost:27017`) **or** a hosted Mongo URI (Atlas works great)
- _(optional)_ An OpenAI API key — the AI chat works offline-fallback without one, but real responses need a key

### 1. Backend setup

```bash
cd backend
cp .env.example .env        # then edit .env and add your secrets
npm install
npm run seed                # OPTIONAL: seed demo user + sample data
npm run dev                 # starts on http://localhost:5000
```

See [`backend/.env.example`](backend/.env.example) for the full annotated config.

---

## 🤖 Free AI with OpenRouter (default)

This project is preconfigured to use [**OpenRouter**](https://openrouter.ai) so you can run Aria for **free**.

1. Sign up at [https://openrouter.ai](https://openrouter.ai)
2. Open [https://openrouter.ai/keys](https://openrouter.ai/keys) and click **Create key**
3. Copy the key (looks like `sk-or-v1-…`)
4. Paste it into `backend/.env`:
   ```env
   OPENAI_BASE_URL=https://openrouter.ai/api/v1
   OPENAI_API_KEY=sk-or-v1-your-key-here
   OPENAI_MODEL=meta-llama/llama-3.1-8b-instruct:free
   ```

Other great **free** models you can swap in:
```
mistralai/mistral-7b-instruct:free
google/gemma-2-9b-it:free
qwen/qwen-2-7b-instruct:free
```

Browse the full free catalog at [https://openrouter.ai/models?supported_parameters=tools&pricing=free](https://openrouter.ai/models). The backend automatically sets the OpenRouter `HTTP-Referer` and `X-Title` headers when it detects an OpenRouter base URL.

> Don't want to set this up yet? The AI assistant still works — it gracefully returns a structured offline-fallback response so the UI stays functional.

---

## 📧 Email authentication (verification + password reset)

The backend uses **Nodemailer** to send 6-digit codes for:

- ✅ Email verification on signup (`/verify-email`)
- 🔁 Resend verification code (`/resend-code`, 60s cooldown)
- 🔑 Forgot password (`/forgot-password`, email-enumeration safe)
- 🔓 Reset password with code (`/reset-password`)

### Choosing a free SMTP provider

| Provider | Free tier | Setup |
| --- | --- | --- |
| **Gmail** | 500 emails/day | Enable 2FA → create [App Password](https://myaccount.google.com/apppasswords) |
| **Brevo** (Sendinblue) | 300 emails/day | Sign up → SMTP & API → SMTP keys |
| **Mailtrap** (dev only) | Unlimited (sandbox) | Sign up → Inboxes → SMTP creds |
| **Resend** | 100 emails/day | Sign up → API keys (uses SMTP-compatible) |

### Gmail (recommended for personal use)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
MAIL_FROM="Smart Study <your-email@gmail.com>"
```

### Brevo

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-brevo-login-email
SMTP_PASS=your-brevo-smtp-key
MAIL_FROM="Smart Study <verified@yourdomain.com>"
```

### Dev mode (no SMTP)

If you leave the SMTP variables empty, the backend will simply log the email + 6-digit code to its console:

```
📧  [dev-mail] -> demo@example.com
    subject: Verify your Smart Study email
    CODE:    482917
```

This is perfect for local testing — just copy the code from the terminal into the UI.

### 2. Frontend setup

```bash
cd frontend
cp .env.example .env       # optional — defaults to http://localhost:5000/api
npm install
npm run dev                # starts on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173). Use **Sign in** → **Fill demo credentials** (if you ran `npm run seed`):

```
Email:    demo@smartstudy.app
Password: password123
```

> The dev server proxies `/api` and `/uploads` to the backend automatically, so you don't need CORS hassles.

---

## API reference

All authenticated routes require an `Authorization: Bearer <jwt>` header.

| Method   | Path                              | Description                          |
| -------- | --------------------------------- | ------------------------------------ |
| `GET`    | `/api/health`                     | Health check                         |
| `POST`   | `/api/auth/register`              | Create account (sends verification code) |
| `POST`   | `/api/auth/login`                 | Login                                |
| `POST`   | `/api/auth/verify-email`          | Verify with 6-digit code             |
| `POST`   | `/api/auth/resend-code`           | Resend verification code             |
| `POST`   | `/api/auth/forgot-password`       | Send password-reset code             |
| `POST`   | `/api/auth/reset-password`        | Reset password with code             |
| `GET`    | `/api/auth/profile`               | Get current user                     |
| `PUT`    | `/api/auth/profile`               | Update name/bio/password/preferences |
| `GET`    | `/api/tasks`                      | List tasks (filters: status, priority, subject, search, sort) |
| `POST`   | `/api/tasks`                      | Create task                          |
| `GET`    | `/api/tasks/:id`                  | Get task                             |
| `PUT`    | `/api/tasks/:id`                  | Update task                          |
| `DELETE` | `/api/tasks/:id`                  | Delete task                          |
| `POST`   | `/api/tasks/reorder`              | Bulk reorder (drag & drop)           |
| `GET`    | `/api/notes`                      | List notes (filters: subject, search) |
| `POST`   | `/api/notes`                      | Create note (multipart `file` optional) |
| `GET`    | `/api/notes/:id`                  | Get note                             |
| `PUT`    | `/api/notes/:id`                  | Update note (multipart `file` optional) |
| `DELETE` | `/api/notes/:id`                  | Delete note                          |
| `GET`    | `/api/schedule`                   | List sessions (filters: from, to, subject) |
| `POST`   | `/api/schedule`                   | Create study session                 |
| `PUT`    | `/api/schedule/:id`               | Update session                       |
| `DELETE` | `/api/schedule/:id`               | Delete session                       |
| `POST`   | `/api/ai/chat`                    | Send a message to Aria               |
| `GET`    | `/api/ai/conversations`           | List recent conversations            |
| `GET`    | `/api/ai/conversations/:id`       | Get a conversation's messages        |
| `DELETE` | `/api/ai/conversations/:id`       | Delete conversation                  |
| `GET`    | `/api/stats/overview`             | Dashboard stats + 7-day series       |
| `GET`    | `/api/stats/subjects`             | Subjects breakdown                   |
| `POST`   | `/api/stats/focus`                | Log a completed focus session        |
| `GET`    | `/api/stats/focus`                | Recent focus sessions                |

### AI request shape

```http
POST /api/ai/chat
{
  "message": "Explain backpropagation in simple terms",
  "conversationId": "optional-uuid",
  "mode": "chat" | "explain" | "summarize",
  "history": [{ "role": "user|assistant", "content": "..." }]
}
```

If `OPENAI_API_KEY` is not configured, the endpoint returns a graceful offline fallback so the UI still works.

---

## Data models

### User
| field | type | notes |
| --- | --- | --- |
| name | string | required |
| email | string | unique, lowercase |
| password | string | bcrypt-hashed, `select: false` |
| bio, avatar | string | |
| preferences | object | theme, pomodoro, dailyGoalHours |
| streak | object | current / best / lastActive |

### Task
`userId`, `title`, `description`, `subject`, `deadline`, `priority` (low/medium/high), `status` (pending/in-progress/completed), `order`, `completedAt`

### Note
`userId`, `title`, `content` (Markdown), `subject`, `tags[]`, `color`, `pinned`, `file: { filename, originalName, mimetype, size, url }`

### Schedule
`userId`, `title`, `subject`, `date`, `startTime` (HH:MM), `endTime` (HH:MM), `color`, `notes`, `completed`

### ChatMessage
`userId`, `conversationId`, `role` (user/assistant/system), `content`

### FocusSession
`userId`, `subject`, `durationMinutes`, `type` (focus/short-break/long-break), `completedAt`

---

## Production builds

### Frontend
```bash
cd frontend
npm run build           # outputs dist/
npm run preview         # static preview
```

### Backend
```bash
cd backend
NODE_ENV=production node server.js
```

You can host the Express API anywhere (Render, Railway, Fly, Heroku, EC2). For a single-domain setup, serve `frontend/dist` from Express with `app.use(express.static(...))`.

---

## Sample data

`backend/utils/seed.js` creates:
- 1 demo user (`demo@smartstudy.app / password123`)
- 8 sample tasks across 6 subjects
- 4 markdown notes (one pinned)
- 5 schedule entries (today / tomorrow / this week)
- 7 days of randomized focus sessions for analytics

Run with:
```bash
cd backend
npm run seed
```

---

## Customizing AI

Aria's system prompt lives in `backend/controllers/aiController.js` (`SYSTEM_PROMPT`). Tweak it to specialize Aria for your subject domain, age group, or pedagogy.

You can also point the OpenAI client at any compatible provider by setting `OPENAI_BASE_URL` in `.env` (e.g. `https://openrouter.ai/api/v1`).

---

## Keyboard shortcuts (in-app)

- `Enter` — send message (in AI chat)
- `Shift+Enter` — newline (in AI chat composer)
- `Esc` — close modals

---

## License

MIT — build something amazing. ✨
