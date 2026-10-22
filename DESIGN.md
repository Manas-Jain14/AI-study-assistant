# AI Study Assistant — Design Document

Status: **DRAFT — awaiting approval before Phase 1 begins**

---

## 1. System Architecture

### 1.1 High-level component diagram

```
┌─────────────────┐        HTTP (REST)        ┌──────────────────┐        HTTP (REST)        ┌─────────────────────┐
│  React Frontend  │ ────────────────────────> │  Node.js Backend  │ ────────────────────────> │  FastAPI AI Service │
│  (Vite + Tailwind)│ <──────────────────────── │  (Express)        │ <──────────────────────── │  (PydanticAI + Gemini)│
└─────────────────┘        JSON responses      └──────────────────┘        JSON responses      └─────────────────────┘
                                                        │
                                                        │ Mongoose
                                                        ▼
                                                ┌──────────────────┐
                                                │  MongoDB Atlas   │
                                                └──────────────────┘
```

**Rule of the architecture:** Node.js is the *only* service that talks to MongoDB and the *only* service the frontend talks to. Python never talks to Mongo and never talks to the frontend directly. Python's only job is running Gemini through PydanticAI agents and returning plain JSON.

### 1.2 Request flow — Upload & Summarize

```
1. User drops a PDF on the Upload page
2. Frontend  --POST /api/upload (multipart)-->  Node backend
3. Node saves the file to /uploads, creates a Document row in MongoDB (status: "processing")
4. Node reads the PDF, extracts raw text (pdf-parse)
5. Node  --POST /process-pdf { text }-->  FastAPI
6. FastAPI runs the Summary Agent (PydanticAI + Gemini) --> returns { summary }
7. Node saves summary into the Document row (status: "done")
8. Node responds to frontend with the saved document
9. Frontend redirects to the Summary page
```

### 1.3 Request flow — Flashcards

```
1. User clicks "Generate Flashcards" on a document
2. Frontend  --POST /api/flashcards/:documentId-->  Node backend
3. Node loads the document's stored text/summary from MongoDB
4. Node  --POST /generate-flashcards { text }-->  FastAPI
5. FastAPI runs the Flashcard Agent --> returns [{ question, answer }, ...]
6. Node inserts each flashcard into MongoDB, linked by document_id
7. Node responds with the flashcard list
```

### 1.4 Request flow — Ask Questions

```
1. User types a question on the Ask page
2. Frontend  --POST /api/ask { documentId, question }-->  Node backend
3. Node loads that document's text from MongoDB
4. Node  --POST /ask-question { text, question }-->  FastAPI
5. FastAPI runs the Question Answering Agent --> returns { answer }
6. Node saves { document_id, question, answer, created_at } into MongoDB
7. Node responds with the answer
8. Frontend appends the Q&A pair to the chat history
```

### 1.5 Why this split (viva talking point)

- **Separation of concerns:** Node = data & I/O, Python = AI reasoning. Easy to explain to an examiner.
- **Swappable AI layer:** Gemini could be replaced with another model in `agents.py` without touching Node or React.
- **Simple mental model:** every feature is "frontend asks Node → Node asks Python if needed → Node saves to Mongo → Node replies."

---

## 2. Database Design (MongoDB Atlas)

Three collections, kept intentionally flat (no embedding, no complex joins — easy to query and explain).

### `documents`
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | auto |
| `title` | String | derived from file name |
| `file_name` | String | stored file name on disk |
| `extracted_text` | String | raw text pulled from PDF (needed later for flashcards/Q&A) |
| `summary` | String | filled in after AI processing |
| `status` | String | `"processing"` \| `"done"` \| `"failed"` |
| `upload_date` | Date | `Date.now` default |

### `flashcards`
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | auto |
| `document_id` | ObjectId | ref → `documents._id` |
| `question` | String | |
| `answer` | String | |

### `questions`
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | auto |
| `document_id` | ObjectId | ref → `documents._id` |
| `question` | String | |
| `answer` | String | |
| `created_at` | Date | `Date.now` default |

**Relationships:** one `document` → many `flashcards`, one `document` → many `questions`. Plain reference by `document_id`, no population complexity needed for a project this size.

---

## 3. API Design

### 3.1 Node.js (Express) — public-facing API

| Method | Route | Body / Params | Response |
|---|---|---|---|
| `POST` | `/api/upload` | multipart form, field `file` | `{ document }` |
| `GET` | `/api/documents` | — | `[{ document }, ...]` |
| `GET` | `/api/documents/:id` | — | `{ document }` (used by Summary page) |
| `POST` | `/api/flashcards/:documentId` | — | `[{ flashcard }, ...]` (triggers generation) |
| `GET` | `/api/flashcards/:documentId` | — | `[{ flashcard }, ...]` (fetch existing) |
| `POST` | `/api/ask` | `{ documentId, question }` | `{ question, answer }` |
| `GET` | `/api/questions/:documentId` | — | `[{ question }, ...]` (chat history) |
| `GET` | `/api/stats` | — | `{ totalDocuments, totalFlashcards, totalQuestions }` (for Dashboard + Analytics) |

### 3.2 Python (FastAPI) — internal AI service, only called by Node

| Method | Route | Body | Response |
|---|---|---|---|
| `POST` | `/process-pdf` | `{ text: string }` | `{ summary: string }` |
| `POST` | `/generate-flashcards` | `{ text: string }` | `{ flashcards: [{ question, answer }] }` |
| `POST` | `/ask-question` | `{ text: string, question: string }` | `{ answer: string }` |

Each route maps 1:1 to one PydanticAI agent in `agents.py` (Summary Agent, Flashcard Agent, QA Agent). No orchestration between agents — each call is independent and stateless.

---

## 4. Folder Structure

```
AI-Study-Assistant/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Upload.jsx
│   │   │   ├── Summary.jsx
│   │   │   ├── Flashcards.jsx
│   │   │   ├── AskQuestions.jsx
│   │   │   └── Analytics.jsx
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── DocumentCard.jsx
│   │   │   ├── FlashcardView.jsx
│   │   │   └── ChatBubble.jsx
│   │   ├── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   └── .env
│
├── backend/
│   ├── models/
│   │   ├── Document.js
│   │   ├── Flashcard.js
│   │   └── Question.js
│   ├── routes/
│   │   ├── documentRoutes.js
│   │   └── questionRoutes.js
│   ├── uploads/
│   │   └── .gitkeep
│   ├── server.js
│   └── .env
│
├── ai-service/
│   ├── agents.py
│   ├── main.py
│   ├── requirements.txt
│   └── .env
│
├── README.md
└── .gitignore
```

Kept deliberately flat — no `services/`, `utils/`, `middleware/`, or `config/` sub-folders unless a file actually forces one to exist. Every file maps directly to something in the "Features" list, so it's easy to point at a file during the viva and explain its one job.

---

## 5. UI Wireframes (text form)

Palette used throughout: background `#0B1220`, sidebar `#111827`, cards `#1E293B`, primary `#3B82F6`, accent `#06B6D4`, text `#F8FAFC` / `#94A3B8`, border `#334155`.

### Shared layout
```
┌───────────┬─────────────────────────────────────────────┐
│           │  Navbar (page title)                         │
│  Sidebar  ├─────────────────────────────────────────────┤
│  - Logo   │                                               │
│  - Dashboard │              Page content                  │
│  - Upload │                                               │
│  - Summary│                                               │
│  - Flashcards                                             │
│  - Ask    │                                               │
│  - Analytics                                               │
└───────────┴─────────────────────────────────────────────┘
```

### Dashboard
```
┌─────────────┬─────────────┬─────────────┐
│ 📄 Documents │ 🗂 Flashcards │ 💬 Questions │   <- StatCard x3, animated count-up
└─────────────┴─────────────┴─────────────┘
Recent Documents
┌──────────────────────────────────────────┐
│ title · uploaded date · status badge      │  x N (DocumentCard list)
└──────────────────────────────────────────┘
```

### Upload
```
┌───────────────────────────────────────────┐
│        Drag & drop a PDF here              │
│          or click to browse                │
└───────────────────────────────────────────┘
[ progress bar while uploading ]
[ "Extracting text..." → "Generating summary..." status text ]
```

### Summary
```
Document title
──────────────────────────
## Heading
- bullet point
- bullet point

## Heading
- bullet point
[ Generate Flashcards ] [ Ask Questions ] buttons
```

### Flashcards
```
                Card 3 of 20
        ┌───────────────────────┐
        │                       │
        │   (question / answer   │   <- flip animation on click
        │    shown on flip)      │
        │                       │
        └───────────────────────┘
        [ ◀ Previous ]   [ Next ▶ ]
```

### Ask Questions
```
┌───────────────────────────────────────────┐
│  chat history (scrollable)                 │
│  🧑 question bubble                         │
│  🤖 answer bubble                           │
└───────────────────────────────────────────┘
[ Ask a question about this document...  ] [Send]
```

### Analytics
```
┌───────────────────────┐  ┌───────────────────────┐
│ Documents over time    │  │ Flashcards generated   │
│ (line/bar chart)       │  │ (bar chart)             │
└───────────────────────┘  └───────────────────────┘
┌───────────────────────────────────────────┐
│ Questions asked over time (line chart)      │
└───────────────────────────────────────────┘
```

---

## 6. Development Roadmap

| Phase | Scope | Done when... |
|---|---|---|
| **Phase 1** | Backend + MongoDB: Express server, Mongoose models (`Document`, `Flashcard`, `Question`), `documentRoutes.js` (upload + list), file storage to `/uploads`, `.env`/`.gitignore` setup | `POST /api/upload` stores a file + metadata row, `GET /api/documents` returns it |
| **Phase 2** | Python AI service: FastAPI app, PydanticAI Summary/Flashcard/QA agents wired to Gemini, all 3 routes working via curl/Postman | `/process-pdf`, `/generate-flashcards`, `/ask-question` each return correct JSON in isolation |
| **Phase 3** | Frontend shell: Vite + Tailwind setup, routing, Sidebar/Navbar, Dashboard + Upload pages wired to real Node API | Uploading a PDF from the browser creates a document and shows it on the Dashboard |
| **Phase 4** | Flashcards: Node route to trigger generation + fetch, Flashcards page with flip animation, prev/next, counter | End-to-end: upload → generate → flip through real flashcards in the UI |
| **Phase 5** | Question Answering + Analytics + Summary page polish: Ask page with chat UI + history, Recharts analytics page, Summary page formatting | Full user journey (upload → summary → flashcards → ask → see it all in analytics) works start to finish |

Each phase ends with a manual test pass (Postman for Node/Python routes, browser click-through for frontend) before moving on, per your instruction not to start a phase until the previous one is complete.

---

## Open items before Phase 1

1. The stray root `.env` has real secrets and one corrupted line — I'll split its values into `backend/.env` and `ai-service/.env` correctly during Phase 1, and delete the root file. Let me know if you'd rather rotate the Gemini/Mongo credentials first since they've been in plaintext.
2. Confirm the plan above (or tell me what to change) and I'll start Phase 1.
