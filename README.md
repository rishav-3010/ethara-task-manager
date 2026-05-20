# Ethara Team Task Manager

A full-stack team task management application with role-based access control. Users can create projects, invite team members as admins or members, create and assign tasks, and track progress on a Kanban board.

## Live Demo
- **Frontend:** https://ethara-task-manager-brown.vercel.app
- **API:** https://ethara-task-manager-obeh.vercel.app
- **API Health:** https://ethara-task-manager-obeh.vercel.app/api/health

## Features

- **Authentication** — email/password signup & login with JWT in httpOnly cookies, bcrypt password hashing
- **Projects** — create projects, invite members by email, manage team
- **Role-based access** — project admins can manage members, edit/delete any task, delete the project; members can create tasks and update tasks they own or are assigned to
- **Tasks** — title, description, priority, due date, assignee, status (To Do / In Progress / Done)
- **Kanban board** — three-column view of project tasks with inline status changes
- **Dashboard** — total tasks by status, overdue count, your assigned tasks, recent activity across all your projects
- **Validation & security** — Zod request validation, Mongoose schema constraints, Helmet, rate limiting on auth, CORS with credentials

## Tech Stack

| Layer    | Tech                                                       |
| -------- | ---------------------------------------------------------- |
| Frontend | React 18, Vite, React Router, Tailwind CSS, lucide-react   |
| Backend  | Node.js, Express, Mongoose                                 |
| Database | MongoDB (Atlas in production)                              |
| Auth     | JWT in httpOnly cookies, bcrypt                            |
| Deploy   | Railway (two services), MongoDB Atlas                      |

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Setup

```bash
# 1. Server
cd server
cp .env.example .env
# Edit .env: set MONGODB_URI and a long random JWT_SECRET
npm install
npm run dev    # http://localhost:4000

# 2. Client (in another terminal)
cd client
cp .env.example .env
npm install
npm run dev    # http://localhost:5173
```

The Vite dev server proxies `/api/*` to the API.

## API Reference

All routes return JSON. Errors: `{ "error": { "message": "...", "code": "..." } }`.

### Auth
| Method | Path               | Notes                              |
| ------ | ------------------ | ---------------------------------- |
| POST   | `/api/auth/signup` | `{ name, email, password }`        |
| POST   | `/api/auth/login`  | `{ email, password }`              |
| POST   | `/api/auth/logout` |                                    |
| GET    | `/api/auth/me`     | returns current user               |

### Projects
| Method | Path                                        | Access        |
| ------ | ------------------------------------------- | ------------- |
| GET    | `/api/projects`                             | auth          |
| POST   | `/api/projects`                             | auth          |
| GET    | `/api/projects/:id`                         | member        |
| PATCH  | `/api/projects/:id`                         | project admin |
| DELETE | `/api/projects/:id`                         | project admin |
| POST   | `/api/projects/:id/members`                 | project admin |
| PATCH  | `/api/projects/:id/members/:userId`         | project admin |
| DELETE | `/api/projects/:id/members/:userId`         | project admin |

### Tasks
| Method | Path                              | Access                                   |
| ------ | --------------------------------- | ---------------------------------------- |
| GET    | `/api/projects/:id/tasks`         | member (filters: status, assignee, overdue) |
| POST   | `/api/projects/:id/tasks`         | member                                   |
| PATCH  | `/api/tasks/:taskId`              | admin / creator / assignee (status only) |
| DELETE | `/api/tasks/:taskId`              | admin / creator                          |

### Dashboard
| Method | Path             | Notes                                                |
| ------ | ---------------- | ---------------------------------------------------- |
| GET    | `/api/dashboard` | counts by status, overdue count, my tasks, recent    |

## Data Model

```
User      { name, email, passwordHash }
Project   { name, description, owner, members: [{ user, role }] }
Task      { project, title, description, status, priority, assignee, dueDate, createdBy }
```

## Role Matrix (within a project)

| Action                   | Admin | Member |
| ------------------------ | :---: | :----: |
| View project             |  yes  |  yes   |
| Edit project info        |  yes  |   —    |
| Delete project           |  yes  |   —    |
| Add / remove members     |  yes  |   —    |
| Change member roles      |  yes  |   —    |
| Create tasks             |  yes  |  yes   |
| Edit any task            |  yes  |   —    |
| Edit own (created) task  |  yes  |  yes   |
| Update status of assigned task | yes | yes |
| Delete task              |  yes  | own only |

## Deployment (Railway)

This repo deploys as **two Railway services** from one GitHub repo plus a **MongoDB Atlas** cluster.

### 1. MongoDB Atlas
1. Create a free M0 cluster on [cloud.mongodb.com](https://cloud.mongodb.com).
2. Create a DB user with read/write access.
3. Network Access → allow `0.0.0.0/0` (Railway has dynamic egress IPs).
4. Copy the connection string (`mongodb+srv://...`).

### 2. Server service (Railway)
1. New Project → Deploy from GitHub repo.
2. Settings → **Root Directory:** `server`.
3. Variables:
   - `MONGODB_URI` = your Atlas connection string
   - `JWT_SECRET` = a long random string
   - `NODE_ENV` = `production`
   - `CLIENT_URL` = the frontend Railway URL (add after step 3)
4. Generate a public domain. Note the URL.

### 3. Client service (same Railway project)
1. Add Service → Deploy from same GitHub repo.
2. Settings → **Root Directory:** `client`.
3. Variables:
   - `VITE_API_URL` = the server's Railway URL (from step 2.4)
4. Generate a public domain.
5. Go back to the server service and set `CLIENT_URL` to the client's URL. Redeploy server.

### Cross-site cookies
The API sets the auth cookie with `SameSite=None; Secure` in production so the browser sends it from the client domain to the API domain. Both services must be on HTTPS (Railway domains are by default).

## Project Structure

```
EtharaAI/
├── server/
│   └── src/
│       ├── index.js              app entry
│       ├── config/db.js          mongoose connection
│       ├── models/               User, Project, Task
│       ├── routes/               auth, projects, projectTasks, tasks, dashboard
│       ├── middleware/           auth, projectAccess, validate, error
│       └── utils/                jwt, ApiError, asyncHandler
├── client/
│   └── src/
│       ├── main.jsx, App.jsx
│       ├── pages/                LoginPage, SignupPage, DashboardPage, ProjectsPage, ProjectDetailPage
│       ├── components/           Navbar, TaskCard, TaskFormModal, MembersPanel, ui/*
│       └── lib/                  api, auth, utils
└── README.md
```

## Demo Video
_(add link to 2–5 min video)_
