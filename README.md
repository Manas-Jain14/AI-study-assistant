# AI Study Assistant

A full-stack study tool that turns uploaded PDF notes into summaries, flashcards, and
a Q&A chat — built as a college mini-project.

## Project Overview

Students upload their PDF notes. The app extracts the text, asks Gemini (via
PydanticAI) to generate a study summary and a set of flashcards, and lets students
chat with an AI that answers questions using only the uploaded notes. Everything is
stored in MongoDB Atlas and shown in a dark, modern dashboard.

## Features

- **PDF Upload** — drag-and-drop or browse, with an upload progress bar and a
  processing status message.
- **Summary Generation** — extracted PDF text is turned into a clean, headed,
  bullet-point study summary.
- **Flashcard Generation** — 10-15 question/answer flashcards per document, with a
  flip animation, previous/next navigation, and a card counter.
- **Ask Questions** — a ChatGPT-style chat that answers questions using only that
  document's notes, with saved conversation history.
- **Analytics** — a chart of total documents, flashcards, and questions.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS, Axios, React Router DOM, Framer Motion, Recharts, Lucide React |
| Backend | Node.js, Express.js, MongoDB Atlas, Mongoose |
| AI Service | Python, FastAPI, PydanticAI, Gemini API |

## System Architecture

```
React Frontend  →  Node.js Backend  →  MongoDB Atlas
                          ↓
                   FastAPI AI Service
                          ↓
                   PydanticAI Agents
                          ↓
                        Gemini
```

Node.js is the main backend — it owns all file uploads, MongoDB reads/writes, and
API responses. It never talks to Gemini directly. Python only runs the three AI
agents and returns plain JSON; it never touches MongoDB or the frontend. See
[DESIGN.md](DESIGN.md) for the full request-flow diagrams.

## Folder Structure

```
AI-Study-Assistant/
├── frontend/           React app (Vite + Tailwind)
│   └── src/
│       ├── pages/       one file per page (Dashboard, Upload, Summary, Flashcards, AskQuestions, Analytics)
│       ├── components/  small reusable pieces (Sidebar, Navbar, StatCard, etc.)
│       └── api.js       shared axios instance
├── backend/             Express API + MongoDB
│   ├── models/          Mongoose schemas (Document, Flashcard, Question)
│   ├── routes/          Express routes (documentRoutes, questionRoutes)
│   └── uploads/          uploaded PDF files
└── ai-service/          FastAPI + PydanticAI + Gemini
    ├── agents.py         the 3 PydanticAI agents
    └── main.py           FastAPI routes that call the agents
```

## MongoDB Collections

Database: `ai_study_assistant`. Mongoose creates each collection automatically the
first time a document is saved — nothing is created manually in Atlas.

**documents**
```js
{ _id, title, file_name, extracted_text, summary, status, upload_date }
```

**flashcards**
```js
{ _id, document_id, question, answer }
```

**questions**
```js
{ _id, document_id, question, answer, created_at }
```

## Setup Instructions

### 1. Backend

```bash
cd backend
npm install
```

### 2. AI Service

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

### 3. Frontend

```bash
cd frontend
npm install
```

## Environment Variables

**backend/.env**
```
PORT=5000
MONGODB_URI=your-mongodb-atlas-connection-string
PYTHON_SERVICE_URL=http://localhost:8000
```

**ai-service/.env**
```
GEMINI_API_KEY=your-gemini-api-key
```

**frontend/.env**
```
VITE_API_URL=http://localhost:5000
```

## Run Instructions

Open **three separate terminals** and paste one block into each.

**Terminal 1 — AI service**
```powershell
cd "c:\Users\Manas\Desktop\AI study assistant\ai-service"
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Backend**
```powershell
cd "c:\Users\Manas\Desktop\AI study assistant\backend"
npm run dev
```

**Terminal 3 — Frontend**
```powershell
cd "c:\Users\Manas\Desktop\AI study assistant\frontend"
npm run dev
```

Then open `http://localhost:5173` in your browser.

## API Documentation

### Node.js (`http://localhost:5000`)

| Method | Route | Description |
|---|---|---|
| POST | `/api/upload` | Upload a PDF and extract its text (summary is generated separately, see below) |
| GET | `/api/documents` | List all documents |
| GET | `/api/documents/:id` | Get one document |
| POST | `/api/documents/:id/summary` | **Streams** the generated summary as plain text, then saves it |
| POST | `/api/flashcards/:documentId` | Generate flashcards for a document |
| GET | `/api/flashcards/:documentId` | Get a document's flashcards |
| POST | `/api/ask` | **Streams** the answer to a question as plain text (`{ documentId, question }`), then saves it |
| GET | `/api/questions/:documentId` | Get a document's Q&A history |
| GET | `/api/stats` | Get total documents/flashcards/questions counts |

The two streaming routes respond with `Content-Type: text/plain` and write the
answer as it's generated, rather than a single JSON body — the frontend reads
them with `fetch()` + `response.body.getReader()` (see `frontend/src/api.js`'s
`streamPost`), not axios.

### Python (`http://localhost:8000`) — called only by the Node backend

| Method | Route | Description |
|---|---|---|
| POST | `/process-pdf` | `{ text }` → streamed plain-text summary |
| POST | `/generate-flashcards` | `{ text }` → `{ flashcards: [{ question, answer }] }` |
| POST | `/ask-question` | `{ text, question }` → streamed plain-text answer |

`/process-pdf` and `/ask-question` use FastAPI's `StreamingResponse` over
PydanticAI's `agent.run_stream(...)`, forwarding each text delta from Gemini as
it arrives. `/generate-flashcards` stays a normal JSON response, since
flashcards are consumed as discrete cards rather than read top-to-bottom.

## Notes

- If MongoDB connection fails with a `querySrv ECONNREFUSED` error, it's usually a
  local DNS/VPN issue rather than a bad connection string — try switching networks
  or DNS provider and reconnecting.




cd "C:\Users\Manas\Desktop\AI study assistant\ai-service"
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload --port 8000



cd "C:\Users\Manas\Desktop\AI study assistant\ai-service"
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload --port 8000





cd "C:\Users\Manas\Desktop\AI study assistant\frontend"
npm run dev



cd "C:\Users\Manas\Desktop\AI study assistant\backend"
npm run dev