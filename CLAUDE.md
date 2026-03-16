# Development Guidelines for Luma

> **About this file (v1.0.0):** Lean core principles optimized for context efficiency, adapted from citypaul's progressive enhancement architecture.
>
> **Architecture:**
> - **CLAUDE.md** (this file): Core philosophy + quick reference (~100 lines, always loaded)
> - **Skills**: Detailed patterns loaded on-demand (tdd, testing, mutation-testing, test-design-reviewer, typescript-strict, functional, refactoring, expectations, planning, front-end-testing, react-testing)
> - **Agents**: Specialized subprocesses for verification and analysis (tdd-guardian, ts-enforcer, refactor-scan, docs-guardian, pr-reviewer, progress-guardian, learn, adr, use-case-data-patterns)

## Project Context

**Luma** is a business management platform (React 18 + TypeScript + Vite + Supabase + Tailwind CSS + shadcn/ui). Moving from MVP to production-grade application.

**Stack:** React 18, TypeScript (strict), Vite, Supabase (auth + DB + RLS), TanStack Query, React Router v6, Tailwind CSS, shadcn/ui (Radix primitives), Zod, React Hook Form, Recharts, Framer Motion.

## Core Philosophy

**Test-Driven Development is the standard.** New features and bug fixes should be driven by tests. Write the test first, make it pass, then refactor. This is how we move from MVP to production-grade.

**Quick Reference:**
- Write tests first (TDD) for new features and bug fixes
- Test behavior, not implementation
- No `any` types — use `unknown` if truly unknown
- TypeScript strict mode always
- Immutable data patterns where practical
- Small, pure functions
- Use Zod schemas at trust boundaries (API responses, form inputs, URL params)

## Testing Principles

**Core principle**: Test behavior through the user's perspective. Coverage through business behavior.

- Write tests first for new features and bug fixes
- Test through public API / component renders exclusively
- Use factory functions for test data (no mutable `let`/`beforeEach` patterns)
- Tests must document expected business behavior

For detailed patterns, load the `testing`, `react-testing`, or `front-end-testing` skills.

## TypeScript Guidelines

**Core principle**: Strict mode always. Schema-first at trust boundaries.

- No `any` types — ever
- No type assertions without justification
- Prefer `type` over `interface` for data structures
- Reserve `interface` for behavior contracts
- Define Zod schemas first, derive types with `z.infer<>`
- Validate at boundaries: Supabase responses, form inputs, URL params

For detailed patterns, load the `typescript-strict` skill.

## Code Style

**Core principle**: Clean, readable, functional-leaning code.

- Prefer immutable patterns — avoid mutation where practical
- Pure functions wherever possible
- No nested if/else — use early returns or composition
- Self-documenting code over comments
- Prefer options objects over 3+ positional parameters
- Use array methods (`map`, `filter`, `reduce`) over imperative loops

For detailed patterns, load the `functional` skill.

## Luma Conventions

**Components**: shadcn/ui primitives in `src/components/ui/`, feature components in `src/components/`. Follow existing patterns.

**Data fetching**: TanStack Query for all server state. Supabase client via `src/lib/supabase.ts`. Custom hooks in `src/hooks/`.

**Routing**: React Router v6 with route-based code splitting. Pages in `src/pages/`.

**Forms**: React Hook Form + Zod resolvers. Validate with Zod schemas.

**Styling**: Tailwind CSS utility classes. Use `cn()` helper from `src/lib/utils.ts` for conditional classes. Follow shadcn/ui patterns.

**State**: TanStack Query for server state. React context for auth/theme. Local `useState` for UI state. No global state library needed.

## Development Workflow

**Core principle**: RED-GREEN-REFACTOR in small, known-good increments.

- RED: Write failing test first
- GREEN: Write minimum code to pass
- REFACTOR: Clean up only if it adds value
- Each increment leaves codebase in working state
- **Wait for commit approval** before every commit

For detailed TDD workflow, load the `tdd` skill.
For planning methodology, load the `planning` skill.

## Summary

Write clean, testable, typed code that evolves through small, safe increments. Every new feature should be driven by tests. The implementation should be the simplest thing that works. When in doubt, favor simplicity and readability over cleverness.

## RepaPips Integration

**Project ID:** `luma`
**RepaPips data:** `/Users/mervindecastro/Cowork/repapips/data/projects/luma/`

### NON-NEGOTIABLE: Update status as you work

Write your status to `/Users/mervindecastro/Cowork/repapips/data/projects/luma/status.json` at the start and end of every task.

**At task start:**
```json
{
  "updated_at": "<ISO timestamp>",
  "agents": [
    { "name": "Andres", "state": "working", "task": "Describe what you are doing" }
  ]
}
```

**At task end — set idle before handing off:**
```json
{ "name": "Andres", "state": "idle", "task": null }
```

Always write the full `agents` array. Include every agent active this session.

### NON-NEGOTIABLE: Log completed work

Append to `/Users/mervindecastro/Cowork/repapips/data/projects/luma/logbook.json` after each task:
```json
{ "id": "<uuid>", "project_id": "luma", "project_name": "Luma", "date": "<date>", "type": "milestone", "agent": "Andres", "body": "What was done and why it matters." }
```

### Check the message queue before starting

Read `/Users/mervindecastro/Cowork/repapips/data/projects/luma/messages.json` for any notes from Mervin before beginning work. Mark messages read by setting `"read": true`.
