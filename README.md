# Luma

Business management platform for freelancers and agencies — clients, proposals, invoices, time tracking, and client portal in one place.

![React](https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=flat-square&logo=shadcnui&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=flat-square&logo=reactquery&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

## Features

- **Client Management** — contacts, notes, tasks, and onboarding stages per client
- **Proposals & Agreements** — WYSIWYG editor (Tiptap), content block templates, client-facing portal with e-signatures
- **Invoicing & Payments** — create, track, and manage invoices with payment recording
- **Time Tracking** — timesheet interface for logging billable hours
- **Client Portal** — branded portal where clients review proposals, sign agreements, and view deliverables
- **Scope Management** — define deliverables, track scope requests, and surface scope alerts
- **Monthly Snapshots & Reports** — recurring performance snapshots and report generation
- **Revenue Dashboard** — revenue goals, analytics, and financial overview (Recharts)
- **Approval Workflows** — pending approval queue across proposals and deliverables
- **GA4 Integration** — pull Google Analytics data into client reports
- **Deadline Tracking** — centralized view of upcoming deadlines across clients
- **Settings & Onboarding** — pick lists, templates, webhook configuration, and Stripe Connect setup

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- A [Supabase](https://supabase.com) project (auth, database, and RLS configured)

### Install

```bash
git clone <repo-url>
cd luma
npm install
```

### Environment

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run preview    # Preview production build
npm run test       # Run tests
npm run lint       # Lint with ESLint
```

## Project Structure

```
src/
  components/      # Feature components (clients, proposals, editor, portal, etc.)
    ui/            # shadcn/ui primitives
  contexts/        # React context providers (auth, theme)
  hooks/           # Custom hooks — data fetching (TanStack Query), business logic
  lib/             # Utilities, Supabase client, helpers
  pages/           # Route-level page components
  test/            # Test setup and utilities
  types/           # Shared TypeScript types
```

## Status

**Tier 1 — Active Development.** Core platform is functional (clients, proposals, invoices, time tracking, portal). Next up: Stripe Connect integration, revenue analytics, and approval workflows.
