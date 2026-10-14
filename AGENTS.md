# AGENTS.md

## UI

For any UI work, follow @DESIGN.md strictly. Don't invent new tokens.

## Project documentation

Read `docs/README.md`, `docs/PROJECT_CONTEXT.md`, and `docs/CURRENT_SNAPSHOT.md` before continuing project work. Use `docs/LOCAL-DEVELOPER-RUNBOOK.md` for local setup and `docs/YEAR-RANGES-HANDOFF.md` when changing member dates.

Read `docs/FAMILY-INTAKE-HANDOFF.md` when changing public collection, moderation, or recurring memorial dates.

Keep the current snapshot and relevant handoff/issue notes aligned with completed work. Distinguish source changes and automated checks from confirmed changes on the real Supabase project. Never copy credentials or real family data into documentation.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
