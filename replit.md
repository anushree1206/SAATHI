# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: Gemini via Replit AI Integrations (`gemini-3-flash-preview`)

## Artifacts

### Saathi (`artifacts/saathi`)
- **Type**: react-vite
- **Preview path**: `/`
- Voice-first AI companion website for Indian students aged 14-22
- Dark theme: #1E1050 (indigo), #FF6B1A (saffron), #0F8066 (teal)
- **Pages**: Landing (`/`), Demo (`/demo`), About (`/about`)
- Uses Web Speech API for mic input + voice output

### API Server (`artifacts/api-server`)
- **Type**: api
- **Routes**:
  - `POST /api/saathi/chat` — Gemini-powered Saathi chat endpoint with warm Indian student context
  - `GET /api/gemini/conversations` — list conversations
  - `POST /api/gemini/conversations` — create conversation
  - `GET /api/gemini/conversations/:id` — get conversation with messages
  - `DELETE /api/gemini/conversations/:id` — delete conversation
  - `GET /api/gemini/conversations/:id/messages` — list messages
  - `POST /api/gemini/conversations/:id/messages` — send message (SSE streaming)
  - `POST /api/gemini/generate-image` — generate image

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## DB Schema

- `conversations` — Gemini conversation threads
- `messages` — Messages within conversations (role: user/assistant)

## Environment Variables

- `AI_INTEGRATIONS_GEMINI_BASE_URL` — Replit-managed Gemini proxy URL
- `AI_INTEGRATIONS_GEMINI_API_KEY` — Replit-managed Gemini API key
- `DATABASE_URL` — PostgreSQL connection string

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
