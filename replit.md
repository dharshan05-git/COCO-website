# COCO Dyslexia Reading Companion

COCO is a privacy-first multilingual reading companion that helps children and adults practise with their own books.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

- Two onboarding paths: Explorer journey for children and Focused reading for adults.
- Local demo library plus browser-local TXT, PDF, and EPUB upload support.
- Word-level reading practice with manual difficult-word selection, heuristic grapheme chunking, and browser SpeechSynthesis pronunciation.
- Optional webcam gaze-learning permission flow; declining camera access keeps audio and manual support fully available.
- English, हिन्दी, and தமிழ் interface copy.
- Local reading sessions, progress, recovery metrics, rewards, settings, and difficult-word history stored in the browser.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
