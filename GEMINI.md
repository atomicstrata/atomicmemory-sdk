# Atomicmemory SDK Agent Guide

Backend-agnostic TypeScript SDK for the AtomicMemory memory layer. It provides
the public `MemoryClient`, pluggable memory providers, local embeddings, storage
adapters, and semantic search primitives.

## Contributor Context

Use this file as the repo-local contributor guide. When behavior depends on
another AtomicMemory repo, rely on the public package/API contract and document
any assumption in the PR.

Before changing code, read the relevant local files first:

- `README.md` for public API usage and package entry points.
- `package.json` for supported scripts, exports, and package metadata.
- `src/memory/provider.ts` and `src/memory/types.ts` before changing provider contracts.
- `src/client/memory-client.ts` before changing client-facing behavior.
- `src/memory/atomicmemory-provider/__tests__/fixtures/README.md` before updating recorded core fixtures.

## Repository Shape

- `src/client/` — public `MemoryClient` facade.
- `src/memory/` — provider interfaces, registration, AtomicMemory and Mem0 adapters.
- `src/storage/` — storage adapters and resilience utilities.
- `src/embedding/` — transformers.js embedding implementation and WASM-related helpers.
- `src/search/` — semantic search and ranking primitives.
- `src/core/` — runtime config, events, and error handling.
- `src/utils/` — validation, logging, performance, and chunking helpers.

## Architecture Rules

- Keep provider contracts backend-agnostic. Provider-specific request/response
  mapping belongs inside that provider's directory.
- Keep browser-safe exports browser-safe. Do not add Node-only dependencies to
  `src/browser.ts` or paths reachable from `@atomicmemory/sdk/browser`.
- Do not make public APIs depend on internal repo paths, local workspace layout,
  or unpublished packages.
- Keep subpath exports in `package.json` aligned with source entry points and
  generated declaration files.
- Treat fixture tests as contract tests. If atomicmemory-core wire shapes change,
  refresh fixtures with `pnpm fixtures:capture` and explain the contract change.
- Fail loudly on invalid config or provider responses. Do not add silent fallback
  behavior that hides data loss, search failures, or provider incompatibility.

## Development Guidelines

### Code Style

- Use TypeScript with explicit public types.
- Avoid `any`; use `unknown` plus validation when parsing external data.
- Use interfaces for object shapes and discriminated unions for variant behavior.
- Keep files under 400 lines excluding comments where practical. Refactor before
  adding large new modules.
- Keep functions under 40 lines excluding catch/finally blocks.
- Comment why, not what. Public APIs and non-obvious behavior need JSDoc.
- Prefer small, deterministic utilities over timing-based behavior.

### Testing

- Add unit tests next to the code under `__tests__/`.
- Provider mappers need fixture coverage when they transform external wire data.
- Storage, embedding, and browser-path changes need tests that exercise the
  relevant runtime assumptions.
- Do not mock around the code path under test just to make a test easier.

## Commands

Use pnpm from the repo root:

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
```

Before opening a PR, run the checks relevant to the change. For code changes,
run at least:

```bash
pnpm typecheck
pnpm test
pnpm test:coverage
FALLOW_COVERAGE=coverage/coverage-final.json pnpm dlx fallow audit --health-baseline=.fallow/health-baseline.json --dupes-baseline=.fallow/dupes-baseline.json --base="${FALLOW_BASE_REF:-origin/main}"
pnpm build
```

Run `git fetch origin` first if `origin/main` is stale or unavailable.

Run `pnpm fixtures:capture` only when intentionally refreshing AtomicMemory
provider fixtures against a live sibling `atomicmemory-core` service.

## Git Workflow

- Do not commit directly to `main`.
- Keep changes scoped to this repo; do not require the private workspace to
  understand or test a public contribution.
- When committing, create a temporary `commit-message.txt`, commit with
  `git commit -F commit-message.txt`, then delete the file.
- When creating a PR, create a temporary `pr-description.md`, use
  `gh pr create --body-file pr-description.md`, then delete the file.
- Never use `git reset --hard`.

## Public Release Hygiene

- Do not commit `.env*`, credentials, local traces, build output, or generated
  caches.
