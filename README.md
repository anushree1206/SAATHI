# SAATHI - Voice Hub for Students

An AI-powered voice companion for Indian students aged 14-22, providing emotional support, academic guidance, and mental health assistance in 5 Indian languages.

**Live Demo:** https://saathi-2-saathi-mj3q.vercel.app/

---

## Features

### AI Intelligence
- **4-Agent Pipeline** — Every message passes through Empathy, Study Advisor, Mental Health, and Reality Check agents in a single optimized Gemini API call
- **4-Model Fallback Chain** — `gemini-2.5-flash-lite` > `gemini-2.0-flash` > `gemini-2.0-flash-lite` > `gemini-1.5-flash` with automatic failover on rate limits (429) and overload (503)
- **Crisis Detection** — Monitors for distress signals and weaves iCall helpline number (9152987821) into responses
- **Multilingual Fallback** — If all Gemini models are exhausted, returns a helpful fallback response in the user's selected language

### Voice Capabilities
- **Speech Recognition** — Browser Web Speech API with 5 language support
- **Text-to-Speech** — Chunked synthesis to prevent mid-sentence cutoffs with automatic language-matched voice selection

### 5-Language Support

| Language | Code  |
|----------|-------|
| English  | en-IN |
| Hindi    | hi-IN |
| Kannada  | kn-IN |
| Telugu   | te-IN |
| Tamil    | ta-IN |

### Auth & Chat History
- JWT authentication (HMAC-SHA256, no external library)
- PBKDF2-SHA512 password hashing (120,000 iterations)
- Persistent conversations with full message history
- User analytics dashboard

---

## Tech Stack

| Layer    | Technology                                                    |
|----------|---------------------------------------------------------------|
| Frontend | React 18, Vite 5, Tailwind CSS v3, Wouter, TanStack Query v5 |
| UI       | shadcn/ui (55 Radix components), Framer Motion, Lucide icons  |
| Backend  | Express 5, TypeScript, ESM (`"type": "module"`)               |
| Database | MongoDB (Atlas or local via mongodb-memory-server)            |
| AI       | Google Gemini (`@google/genai`) with 4-model fallback         |
| Logging  | Pino + pino-http structured JSON logging                      |
| Voice    | Web Speech API (SpeechRecognition + SpeechSynthesis)          |

---

## Project Structure

```
SAATHI/
├── backend/                  # Express API server (port 3000)
│   ├── index.ts              # Entry point — loads .env, starts server
│   ├── app.ts                # Express setup, CORS, middleware
│   ├── config.ts             # Environment variable exports
│   ├── routes/
│   │   ├── index.ts          # Mounts /auth, /saathi, /healthz routers
│   │   ├── auth.ts           # POST /api/auth/signup, /login, GET /me
│   │   ├── chat.ts           # POST /api/saathi/chat (core feature)
│   │   └── health.ts         # GET /api/healthz
│   ├── agents/
│   │   ├── empathy.ts        # Empathy agent prompt spec
│   │   ├── study.ts          # Study Advisor prompt spec
│   │   ├── mental.ts         # Mental Health prompt spec
│   │   └── reality.ts        # Reality Check prompt spec
│   ├── lib/
│   │   ├── gemini.ts         # Gemini client + 4-model fallback chain
│   │   ├── crisis.ts         # iCall helpline, crisis detection, fallbacks
│   │   ├── mongo.ts          # MongoDB connection + all CRUD helpers
│   │   ├── jwt.ts            # Custom JWT sign/verify (HMAC-SHA256)
│   │   ├── password.ts       # PBKDF2-SHA512 hashing
│   │   └── logger.ts         # Pino logger
│   ├── middlewares/
│   │   └── auth.ts           # requireAuth JWT middleware
│   ├── db/
│   │   └── schema.ts         # MongoDB document TypeScript types
│   └── package.json
│
├── frontend/                 # React SPA (port 5173)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx      # Landing page
│   │   │   ├── Chat.tsx      # Main chat interface
│   │   │   ├── Login.tsx     # Login form
│   │   │   ├── Signup.tsx    # Signup form
│   │   │   ├── Dashboard.tsx # User analytics
│   │   │   └── About.tsx     # About page
│   │   ├── components/
│   │   │   ├── VoiceButton.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── AgentPipeline.tsx
│   │   │   ├── LanguageSelect.tsx
│   │   │   ├── layout/       # Navbar, Footer
│   │   │   └── ui/           # 55 shadcn components
│   │   ├── lib/
│   │   │   ├── api.ts        # apiFetch, apiGet/apiPost, useSaathiChat hook
│   │   │   ├── auth.ts       # localStorage auth session management
│   │   │   ├── speech.ts     # speakInChunks, findVoice, stopSpeaking
│   │   │   └── utils.ts      # cn() helper
│   │   ├── hooks/            # useAuth, use-toast, use-mobile
│   │   ├── App.tsx           # Wouter router
│   │   └── main.tsx          # Mount + auth token setup
│   ├── vite.config.ts        # Proxies /api -> localhost:3000
│   ├── tailwind.config.ts
│   ├── postcss.config.cjs
│   └── package.json
│
└── .env                      # Environment variables (not committed)
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### 1. Clone & Install

```bash
git clone https://github.com/kumardipesh7/SAATHI.git
cd SAATHI

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/saathi?retryWrites=true&w=majority
MONGO_DB_NAME=saathi
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173
```

> **No MongoDB?** If `MONGO_URL` is not set or the Atlas cluster is unreachable, the backend automatically starts a local MongoDB instance using `mongodb-memory-server` with persistent storage in `.mongodb-data/`.

### 3. Run

```bash
# Terminal 1 — Backend (port 3000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

---

## API Endpoints

| Method | Path                | Auth | Description                    |
|--------|---------------------|------|--------------------------------|
| GET    | `/api/healthz`      | No   | Health check                   |
| POST   | `/api/auth/signup`   | No   | Create account (name, email, password) |
| POST   | `/api/auth/login`    | No   | Login (email, password) → JWT  |
| GET    | `/api/auth/me`       | Yes  | Get current user profile       |
| POST   | `/api/saathi/chat`   | Yes  | Send message to AI pipeline    |

### Chat Request/Response

```json
// POST /api/saathi/chat
// Headers: Authorization: Bearer <jwt_token>

// Request
{
  "message": "I'm stressed about exams",
  "language": "en-IN",
  "conversationId": "optional-existing-id"
}

// Response
{
  "response": "I understand exam stress can be overwhelming...",
  "conversationId": "6a2eded8a2848ad75df761ee",
  "pipeline": [
    { "agent": "Empathy", "insight": "Student experiencing exam-related anxiety." },
    { "agent": "Study Advisor", "insight": "Concern about exam preparation." },
    { "agent": "Mental Health", "insight": "Moderate stress, no crisis detected." },
    { "agent": "Reality Check", "insight": "Final response crafted from all insights." }
  ]
}
```

---

## How the AI Pipeline Works

```
User Message
    │
    ▼
┌─────────────────────────────────────────────┐
│  Single Gemini API Call (combined prompt)    │
│                                             │
│  1. Empathy Agent    → emotional analysis   │
│  2. Study Advisor    → academic context     │
│  3. Mental Health    → stress + crisis check │
│  4. Reality Check    → final synthesis      │
└─────────────────────────────────────────────┘
    │
    ▼
Structured JSON Response + Pipeline Visualization
```

- All 4 agents run in a **single API call** (not 4 sequential calls)
- If the primary model hits a rate limit, it automatically falls back to the next model
- Crisis keywords trigger automatic iCall helpline (9152987821) integration
- If all models fail, a multilingual fallback response is returned

---

## License

MIT

---

**Built for Indian students everywhere**
