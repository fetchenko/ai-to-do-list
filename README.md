# AI To-Do List

A task manager where any task can be broken down into actionable subtasks by AI.
Built to practice modern frontend/full-stack patterns: a pluggable AI provider
layer, a layered repository/service architecture, optimistic UI updates, AI
response streaming, and per-user rate limiting — not just CRUD.

[![CI](https://github.com/fetchenko/ai-to-do-list/actions/workflows/ci.yml/badge.svg)](https://github.com/fetchenko/ai-to-do-list/actions/workflows/ci.yml)

[🔗 **Live demo:** 📸](https://ai-to-do-list-gilt.vercel.app)

<img src="https://github.com/user-attachments/assets/c7e81998-bcab-468b-8959-a0d7a8d4e5ca" alt="Demo of AI subtask generation" width="600" />

## Why this project

Most to-do app clones only exercise CRUD. This one adds a real integration
point — calling an external AI provider, validating its output, handling its
failure modes, streaming partial results to the UI, and controlling the
cost/abuse surface that comes with letting users trigger paid API calls.

## Features

- **Streaming AI subtask generation** — subtasks arrive incrementally over an
  NDJSON stream instead of waiting for the complete AI response, so the draft
  UI can render results as they are generated.
- **AI subtask generation** — describe a task, get back a structured list of
  actionable subtasks, reviewed as a draft before being saved.
- **Pluggable AI provider layer** — DeepSeek (cloud) or Ollama (local model)
  behind one `AIProvider` interface, switched with a single env var. No
  business logic changes when swapping providers.
- **Per-user concurrency lock** — an AI generation lock prevents a user from
  firing overlapping AI generation requests and is held for the lifetime of
  the stream.
- **Per-user quota limiting** — caps successful AI generations per user to
  control cost.
- **AI generation logging** — every request/response is logged with model,
  prompt version, duration, and token usage (including cache hit/miss and
  reasoning tokens), independent of which provider served it. Streaming
  generations are finalized, failed, or cancelled as the stream completes.
- **Cancellation and timeout handling** — the stream reacts to client
  disconnects and a 60-second timeout, releasing the generation lock and
  recording the cancellation reason.
- **Task status & metadata** — tasks carry status (`active` / `done`)
- **Fractional-index task ordering** — positions are stored so reordering
  never requires re-indexing the whole list. The data model is ready for
  drag-and-drop; the drag-and-drop UI itself is still on the roadmap below.
- **Defense-in-depth on ownership** — `user_id` is enforced server-side by a
  database trigger on insert, on top of RLS, regardless of what a client
  sends.
- **Optimistic UI updates** — task edits update the UI immediately via
  TanStack Query and roll back automatically if the request fails.
- **Schema-validated boundaries** — Zod validates API request bodies and
  every AI provider response before it touches the database.
- **Structured error handling** — typed application errors mapped to HTTP
  status codes, with Supabase errors normalized into the same shape.
- **Email/password auth** via Supabase SSR (signup, login, password reset).

## Tech stack

**Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS,
shadcn/ui, Zustand
**Data/server:** Supabase (Postgres + Auth), TanStack Query, Zod
**AI:** DeepSeek API, Ollama (local), provider-abstracted with streaming support
**Testing:** Vitest, Testing Library, Playwright
**Tooling:** ESLint, Prettier, GitHub Actions CI

## Architecture

The codebase is organized as a feature-sliced architecture rather than a flat
`components/lib` split:

<details>
<summary><b>Full directory structure</b></summary>

```
proxy.ts                      # thin Next.js middleware entry point —
                               # delegates to infrastructure/supabase/proxy.ts

src/
  app/                       # Next.js routes only — no business logic
    api/subtasks/generate/   # POST /api/subtasks/generate — non-streaming endpoint
    api/subtasks/stream/     # POST /api/tasks/:taskId/subtasks/stream — NDJSON stream
    auth/                    # login, sign-up, password reset, email confirm
    config/                  # route & API path constants
    page.tsx                 # renders Hero (signed out) or UserTasks (signed in)

  features/                 # one folder per domain feature
    home/
      components/           # hero.tsx (landing page), user-content.tsx
                               # (server-side auth branch), content-skeleton.tsx
    tasks/
      components/            # task list, task item, draft-subtasks review
      repository/            # raw Supabase data access (CRUD)
      services/              # business logic (e.g. position calc, AI fetch)
      hooks/                 # TanStack Query hooks (optimistic updates + stream)
      mappers/, types/, validation/, constants/, stores/
    auth/
      components/, repository/ # auth.repository (client) vs
                                # auth.server.repository (server-only)
      types/, validation/
    theme/

  infrastructure/            # technical concerns, not business domains
    ai/
      providers/              # deepseek/, ollama/ — implement AIProvider
      generations/             # streaming generation resource, locks, logging
      services/                # subtasks.service.ts (orchestrates generation),
                                # quota + logging services
      helpers/, prompts/, validation/, types/
    supabase/                 # client.ts, server.ts, admin.ts, and proxy.ts
                                # (the actual session-refresh logic the root
                                # proxy.ts delegates to)
    react-query/

  shared/                    # cross-cutting, no feature/domain knowledge
    errors/                   # AppError, error codes, HTTP status map,
                                # Supabase error normalization
    ui/                       # shadcn/ui primitives
    types/                    # generated Supabase database types + stream events
    validation/, utils/

supabase/
  migrations/                # SQL schema, RLS policies, RPC functions

e2e/                         # Playwright end-to-end tests
tests/
  unit/                      # AI response normalization & validation
  fixtures/, mocks/
```

</details>

**Within each feature**, the flow is `repository` (talks to Supabase, knows
nothing about business rules) → `service` (business logic, e.g. computing the
next fractional-index position, or orchestrating an AI call + log) →
`component`/`hook` (UI, calls services, never touches Supabase directly).

AI generation is split into two layers: the service acquires the per-user
lock and creates the generation log, while the generation resource owns the
lifecycle of the stream. It converts provider events into client-safe NDJSON
events and guarantees that completion, failure, timeout, and client
cancellation release the lock and update the generation log.

`infrastructure/` holds things that are technical, not domain-specific — the
AI provider abstraction, Supabase clients, React Query setup — so a feature
can depend on infrastructure, but infrastructure never depends on a feature.

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/fetchenko/ai-to-do-list.git
cd ai-to-do-list
npm install
```

### 2. Set up Supabase

Create a project at [supabase.com](https://supabase.com), then apply the
schema in `supabase/migrations/` using the Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

This creates the `tasks` and `ai_generations` tables, RLS policies, and the
RPC functions used by the application.

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_ACCESS_TOKEN=
SUPABASE_SERVICE_ROLE_KEY=

DEEPSEEK_KEY=               # required if AI_PROVIDER=deepseek (default)
AI_PROVIDER=                # "deepseek" (default) or "ollama"
```

To use a local model instead of DeepSeek, install [Ollama](https://ollama.com),
pull `qwen2.5-coder:1.5b`, and set `AI_PROVIDER=ollama` — no API key needed.

### 4. Run it

```bash
npm run dev
```

## Testing

### Unit tests (Vitest)

```bash
npm run test       # watch mode
npm run test:run   # single run (used in CI)
npm run test:ui    # Vitest UI
```

### End-to-end tests (Playwright)

Create a dedicated test account in your Supabase project (not your personal
login — these tests create and delete real rows), then add to `.env.local`:

```
E2E_TEST_EMAIL=
E2E_TEST_PASSWORD=
```

```bash
npx playwright install chromium   # once, downloads the browser
npm run test:e2e
npm run test:e2e:ui               # interactive mode
```

Covers task creation/completion, form validation, and the AI subtask
generation flow. The AI stream is mocked at the network layer with NDJSON
`subtask` and `done` events, so tests don't burn real API quota or flake on
model non-determinism — they verify the application's stream handling rather
than the model's output quality.

All e2e tests share one authenticated session (saved once by
`e2e/auth.setup.ts`), so they run on a single Playwright worker by design —
Supabase rotates refresh tokens on use, which would otherwise make parallel
workers invalidate each other's session.

## Known limitations

- AI subtask generation is currently capped at 1–2 subtasks per request.
- Single AI feature for now (subtask generation only).

## Roadmap

**UI/UX**

- Drag-and-drop reordering (data model already supports it via fractional
  indexing; the UI interaction isn't built yet)
- Audit responsive layout across breakpoints — not yet checked
- Undo toast on task delete
- Search bar for tasks
- Infinite scroll / lazy loading for large task lists
- Customize shadcn/ui components beyond the defaults

**AI feature**

- Send a task's existing subtasks as context when generating more, to avoid
  duplicate suggestions
- Add a `retryable` flag on AI failures + a retry button in the UI
- Stress-test the AI generation lock under real concurrent load

**Code quality**

- Split components into view (presentational) vs. controlled/container
  components
- Standardize custom hook usage into one consistent pattern across the app
- Add `eslint-plugin-boundaries` to enforce the feature/infrastructure/shared
  layering at lint time instead of by convention alone
- Migrate from React Hook Form to native React 19 form actions

**Testing & CI**

- Increase unit test coverage beyond AI response normalization

**Auth & growth**

- Google OAuth sign-in
- Basic analytics for site visitors

## License

MIT — see [LICENSE](./LICENSE).
