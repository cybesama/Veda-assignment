# VedaAI — AI Assessment Creator

A full-stack web application that lets teachers create assignments and generate structured, AI-powered question papers in real time. Built with Next.js, Express, MongoDB, Redis, BullMQ, and OpenAI GPT-4o.

---

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Approach](#approach)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [API Reference](#api-reference)

---

## Features

- **Assignment creation** — 2-step form with file upload (PDF/image), due date, question type configuration (type, count, marks per question), and additional instructions
- **AI question generation** — Structured prompt pipeline converts form data into a GPT-4o request; PDF/image reference files are extracted and injected as content source
- **Real-time progress** — WebSocket pushes job progress (0→100%) from BullMQ worker to the browser as the paper is being generated
- **Structured output** — Generated paper is parsed from JSON and rendered in a clean exam-paper layout with sections, difficulty tags, marks, and an answer key
- **Regenerate** — One-click regeneration discards the old paper and queues a new job using the same assignment details
- **PDF download** — Browser print dialog produces a print-ready PDF

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Browser (Next.js)                  │
│                                                         │
│  Zustand Store ◄──── WebSocket client ◄──────────────┐  │
│       │                                              │  │
│  React Pages/Components                              │  │
│       │  REST (axios)                                │  │
└───────┼──────────────────────────────────────────────┼──┘
        │                                              │
        ▼                                              │
┌───────────────────────────────────────────────────┐  │
│              Express API  (port 4000)             │  │
│                                                   │  │
│  POST /api/assignments  ──► BullMQ Queue ──────►  │  │
│  GET  /api/assignments/:id                        │  │
│  GET  /api/assignments/:id/result                 │  │
│  POST /api/assignments/:id/regenerate             │  │
│  DELETE /api/assignments/:id                      │  │
│                                                   │  │
│  WebSocket Server (ws://)  ───────────────────────┘  │
└─────────────────┬─────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌──────────────┐   ┌────────────────────────────────────┐
│  MongoDB     │   │  Redis (Upstash)                   │
│  (Atlas)     │   │                                    │
│              │   │  BullMQ Job Queue                  │
│  assignments │   │  ┌──────────────────────────────┐  │
│  results     │   │  │  Generation Worker           │  │
└──────────────┘   │  │  1. Extract file content     │  │
                   │  │  2. Build structured prompt  │  │
                   │  │  3. Call GPT-4o              │  │
                   │  │  4. Parse JSON response      │  │
                   │  │  5. Save result to MongoDB   │  │
                   │  │  6. Push WS event to browser │  │
                   │  └──────────────────────────────┘  │
                   └────────────────────────────────────┘
```

### Data Flow

1. Teacher fills in the assignment form and clicks **Generate Paper**
2. Frontend `POST /api/assignments` with form data + optional file
3. Express saves the assignment to MongoDB, adds a job to the BullMQ queue, returns `assignmentId`
4. Frontend subscribes to WebSocket events for that `assignmentId` and shows the progress screen
5. BullMQ worker picks up the job:
   - Reads the uploaded file (PDF text extraction via `pdf-parse`, or base64 image for GPT-4o vision)
   - Builds a structured prompt with the reference content as the primary source
   - Calls `gpt-4o` with `response_format: { type: "json_object" }` to guarantee parseable output
   - Validates and saves the parsed paper to MongoDB
   - Emits `job:completed` over WebSocket
6. Browser receives the event, fetches the result, renders the structured question paper

---

## Approach

### AI Prompt Design

The core challenge is making the AI generate questions from the **reference file** rather than from its general knowledge about the subject. Three techniques achieve this:

**1. Reference-first prompt structure**  
When a file is uploaded, the extracted content is placed at the very top of the prompt inside a visible delimiter block, before any instructions. This gives it maximum attention weight.

```
═══ REFERENCE DOCUMENT (your ONLY source) ═══
[extracted PDF / image content]
═══════════════════════════════════════════════

TASK: Generate N questions using ONLY the content above...
```

**2. Subject/class isolation**  
The subject and class fields are explicitly labelled as *paper header metadata* and are only referenced in the JSON output schema — they never appear as content instructions. This prevents GPT-4o from anchoring to e.g. "english literature" as a topic guide.

**3. Strict system prompt**  
A separate system-level instruction reinforces the rule: *"Ignore your general knowledge about the subject name. Every question must be traceable to the reference document."*

### JSON-First Generation

GPT-4o is called with `response_format: { type: "json_object" }`, which guarantees a parseable response without markdown fences. The response is validated for required fields (`sections`, `answerKey`) before being stored, preventing malformed papers from reaching the frontend.

### Real-Time Updates via WebSocket + BullMQ

- BullMQ worker emits progress at key stages (10% → 30% → 80% → 100%)
- The WebSocket manager maintains a `Map<clientId, assignmentId>` so broadcasts are scoped — only the browser that created that assignment receives its events
- On reconnect (the WS client auto-reconnects every 3s), the browser re-subscribes using the `assignmentId` from the URL, so progress is never lost

### State Management (Zustand)

Two stores keep frontend state clean:

- `useFormStore` — owns the multi-step creation form (question types, file, metadata). Resets on successful submission.
- `useAssignmentStore` — owns the assignments list, current result, and live job status. Updated by both REST responses and WebSocket events.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| State | Zustand |
| Real-time (client) | Native WebSocket with auto-reconnect |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB (Mongoose) — MongoDB Atlas |
| Cache / Queue broker | Redis — Upstash |
| Job queue | BullMQ |
| Real-time (server) | ws (WebSocket server) |
| AI | OpenAI GPT-4o (`gpt-4o`) |
| PDF extraction | pdf-parse v1 |
| File upload | Multer |

---

## Project Structure

```
veda/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.ts              # MongoDB connection
│   │   │   └── redis.ts           # Redis / ioredis setup
│   │   ├── models/
│   │   │   ├── Assignment.ts      # Assignment schema
│   │   │   └── Result.ts          # Generated paper schema
│   │   ├── queues/
│   │   │   └── generationQueue.ts # BullMQ queue definition
│   │   ├── workers/
│   │   │   └── generationWorker.ts # Job processor + WS events
│   │   ├── services/
│   │   │   ├── aiService.ts       # Prompt builder + GPT-4o call
│   │   │   └── fileService.ts     # PDF / image extraction
│   │   ├── routes/
│   │   │   └── assignments.ts     # REST endpoints
│   │   ├── websocket/
│   │   │   └── wsManager.ts       # WS broadcast manager
│   │   └── index.ts               # Server entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── assignments/
│   │   │   │   ├── page.tsx           # Assignment list
│   │   │   │   ├── create/page.tsx    # Creation form
│   │   │   │   └── [id]/result/page.tsx # Paper output
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── layout/            # Sidebar, Header, MobileNav
│   │   │   ├── assignments/       # AssignmentCard, EmptyState
│   │   │   ├── create/            # Form, FileUpload, QuestionTypeRow
│   │   │   └── output/            # QuestionPaper, GenerationLoading
│   │   ├── store/
│   │   │   └── assignmentStore.ts # Zustand stores
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts    # WS client hook
│   │   ├── lib/
│   │   │   └── api.ts             # Axios API calls
│   │   └── types/
│   │       └── index.ts           # Shared TypeScript types
│   ├── .env.local                 # (not committed)
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── .gitignore
├── package.json                   # npm workspaces root
└── README.md
```

---

## Setup & Installation

### Prerequisites

- Node.js 18+
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free cluster
- An [Upstash](https://upstash.com) free Redis database
- An [OpenAI](https://platform.openai.com) API key with GPT-4o access

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/veda-assessment.git
cd veda-assessment
```

### 2. Install dependencies

```bash
npm install
```

This installs dependencies for both `frontend/` and `backend/` via npm workspaces.

### 3. Configure environment variables

#### Backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` — see [Environment Variables](#environment-variables) below.

#### Frontend

The frontend `.env.local` defaults are already set for local development:

```bash
# frontend/.env.local (already included)
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

---

## Environment Variables

### `backend/.env`

| Variable | Description | Example |
|---|---|---|
| `PORT` | Express server port | `4000` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/veda` |
| `REDIS_URL` | Upstash Redis URL (use `rediss://` for TLS) | `rediss://default:pass@host.upstash.io:6380` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-proj-...` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:3000` |
| `UPLOAD_DIR` | Directory for uploaded files | `./uploads` |

```env
PORT=4000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/veda-assessment?retryWrites=true&w=majority
REDIS_URL=rediss://default:<password>@<host>.upstash.io:6379
OPENAI_API_KEY=<your-openai-api-key>
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
UPLOAD_DIR=./uploads
```

---

## Running the App

### Development (both servers)

```bash
# From the root — runs frontend and backend concurrently
npm run dev
```

Or run them separately:

```bash
# Terminal 1 — backend (port 4000)
cd backend && npm run dev

# Terminal 2 — frontend (port 3000)
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build
cd backend && npm start
cd frontend && npm start
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/assignments` | List all assignments (supports `?search=` and `?status=`) |
| `POST` | `/api/assignments` | Create assignment + queue generation job |
| `GET` | `/api/assignments/:id` | Get single assignment |
| `GET` | `/api/assignments/:id/result` | Get generated question paper |
| `POST` | `/api/assignments/:id/regenerate` | Discard old paper and queue new generation |
| `DELETE` | `/api/assignments/:id` | Delete assignment and its result |
| `GET` | `/health` | Health check |

### WebSocket Events

Connect to `ws://localhost:4000` and send a subscribe message:

```json
{ "type": "subscribe", "assignmentId": "<id>" }
```

Incoming events:

| Event | Payload |
|---|---|
| `job:progress` | `{ jobId, assignmentId, status: "active", progress: 0–100 }` |
| `job:completed` | `{ jobId, assignmentId, status: "completed", progress: 100, resultId }` |
| `job:failed` | `{ jobId, assignmentId, status: "failed", error: "message" }` |

---

## Author

**Pradeep Dheenraj Singh**
reyanshsinha19@gmail.com
