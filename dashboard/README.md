# RageVFX Dashboard

Production-ready data dashboard built with Next.js 16, React 19, and the latest modern tech stack.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19 and TypeScript
- **Styling**: Tailwind CSS v4.0 (Oxide engine)
- **Components**: shadcn/ui (Radix UI primitives)
- **Data Layer**: TanStack Query v5 for client-side state
- **Data Table**: TanStack Table v8 with sorting, filtering, and pagination
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts for data visualization
- **ORM**: Drizzle ORM (ready for Supabase integration)

## Getting Started

### Development

```bash
# From the root directory
npm run dashboard:dev
```

This starts the Next.js development server at `http://localhost:3000`

### Build

```bash
# From the root directory
npm run dashboard:build
```

### Production

```bash
# From the root directory
npm run dashboard:start
```

## Features

### Dashboard Overview
- ✅ KPI cards with real-time metrics
- ✅ Line and bar charts with Recharts
- ✅ Projects data table with TanStack Table
- ✅ Filtering, sorting, and pagination
- ✅ Row selection with bulk actions
- ✅ Loading states with skeletons
- ✅ Empty states with clear CTAs
- ✅ Error boundaries

### UI/UX Design Principles
- ✅ Calm, neutral color palette (dark theme by default)
- ✅ Data-first approach - content dominates, UI is quiet
- ✅ Persistent left sidebar with minimal visual weight
- ✅ Clear hierarchy and focus
- ✅ Accessible keyboard navigation (Radix UI primitives)
- ✅ Optimistic updates ready
- ✅ Toast notifications for feedback
- ✅ Progressive disclosure patterns

### Architecture
- ✅ App Router with route groups `(dashboard)`
- ✅ Server Components for initial data
- ✅ Client Components for interactivity
- ✅ Separation of concerns: server state, UI state, form state
- ✅ Type-safe with TypeScript
- ✅ Zod schemas for validation

## Directory Structure

```
dashboard/
├── app/
│   ├── (dashboard)/           # Dashboard route group
│   │   ├── dashboard/         # Main dashboard page
│   │   └── layout.tsx         # Persistent sidebar layout
│   ├── globals.css            # Global styles + design tokens
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Home page (redirects to /dashboard)
├── components/
│   ├── dashboard/             # Dashboard-specific components
│   │   ├── charts.tsx
│   │   ├── kpi-cards.tsx
│   │   ├── projects-table.tsx
│   │   └── sidebar.tsx
│   └── ui/                    # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── table.tsx
│       └── ...
├── lib/
│   └── utils.ts               # Utility functions (cn, etc.)
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## Design System

### Colors
- **Neutral base**: Used for 95% of the interface
- **Primary accent**: Used only for primary actions and highlights
- **System colors**:
  - Red = error/destructive
  - Green = success
  - Contrast is WCAG AA compliant

### Spacing
- Strict 4px grid system
- Consistent spacing scale via Tailwind

### Typography
- Inter font family
- Clear hierarchy with font sizes and weights

## Next Steps

### Phase 1: Data Integration (Supabase)
- [ ] Set up Drizzle ORM with Supabase
- [ ] Create database schemas
- [ ] Implement API routes
- [ ] Add server-side caching with `use cache`
- [ ] Implement real data fetching with TanStack Query

### Phase 2: Authentication
- [ ] Integrate Auth.js v5 or Clerk
- [ ] Add RBAC/permissions
- [ ] Server-side validation
- [ ] Rate limiting with Upstash/Redis

### Phase 3: AI Integration
- [ ] Vercel AI SDK setup
- [ ] Streaming LLM responses
- [ ] Tool calling
- [ ] AI-powered features

### Phase 4: Forms & CRUD
- [ ] Create/Edit project modal with React Hook Form
- [ ] Zod validation schemas
- [ ] Optimistic updates
- [ ] Toast notifications

### Phase 5: Polish
- [ ] Loading boundaries
- [ ] Error boundaries
- [ ] Keyboard shortcuts
- [ ] Performance optimization
- [ ] Accessibility audit

## Development Guidelines

### UI Focus Principles
1. **Data is the hero** - UI should point toward data, not compete with it
2. **Sidebar is quiet** - Lower contrast, minimal emphasis
3. **Single focal point** - One thing matters most on each screen
4. **Progressive disclosure** - Advanced controls appear only when needed
5. **Immediate feedback** - Every action gets a response

### Interaction Patterns
- **Popovers** for quick, non-blocking actions
- **Modals** for complex/blocking flows
- **Toasts** for success/error/warning
- **Optimistic UI** for common mutations
- **Skeletons** for loading states

### States to Design
For every component:
- ✅ Loading state (skeleton)
- ✅ Empty state (clear CTA)
- ✅ Error state (recoverable, with retry)
- ✅ Success confirmation (toast)

## License

MIT
