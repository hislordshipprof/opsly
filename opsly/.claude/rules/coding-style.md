# Coding Style Rules — OPSLY

## Core Principles

### 1. MANY SMALL FILES > FEW LARGE FILES
- Target: 200-400 lines per file
- Maximum: 800 lines (split if exceeds)
- Organize by feature module (NestJS modules, React feature folders)

### 2. Immutability First
```typescript
// CORRECT - Create new object
const updated = { ...workOrder, status: WorkOrderStatus.ASSIGNED };

// AVOID - Mutation
workOrder.status = WorkOrderStatus.ASSIGNED; // Don't do this
```

### 3. Small Functions
- Target: < 30 lines per function
- Maximum: 50 lines (refactor if exceeds)
- Single responsibility per function

### 4. Shallow Nesting
- Maximum: 4 levels of nesting
- Early returns to reduce nesting
- Extract complex conditions to functions

## File Organization

### Backend Structure (NestJS)
```
backend/src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── decorators/
│   │   └── roles.decorator.ts
│   └── dto/
│       ├── login.dto.ts
│       └── register.dto.ts
├── work-orders/
│   ├── work-orders.module.ts
│   ├── work-orders.controller.ts
│   ├── work-orders.service.ts
│   └── dto/
├── properties/
├── escalations/
├── metrics/
├── websocket/
│   └── opsly.gateway.ts
├── ai/
│   ├── ai.module.ts
│   ├── prompts/          # Agent system prompts as separate files
│   └── agents/
└── prisma/
    ├── schema.prisma
    └── seed.ts
```

### Frontend Structure (React + Vite)
```
frontend/src/
├── components/
│   ├── ui/               # shadcn/ui base components
│   ├── voice/            # VoiceWidget + audio components
│   ├── dashboard/        # Manager command center
│   ├── tenant/           # Tenant portal
│   └── technician/       # Technician view
├── pages/
├── hooks/
│   └── useWebSocket.ts   # One hook per file
├── services/
│   └── api/              # API client + query keys
├── stores/               # Zustand stores
└── types/
```

## Naming Conventions

### Files
- NestJS modules: `kebab-case` (e.g., `work-orders.service.ts`)
- React Components: `PascalCase.tsx` (e.g., `WorkOrderCard.tsx`)
- Hooks: `camelCase.ts` (e.g., `useWorkOrderEvents.ts`)
- Types: `camelCase.ts` or `PascalCase.ts`
- DTOs: `kebab-case.dto.ts` (e.g., `create-work-order.dto.ts`)

### Code
- Variables/Functions: `camelCase`
- Components/Classes: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Types/Interfaces: `PascalCase`
- Enums: `PascalCase` with `SCREAMING_SNAKE_CASE` values
- Database fields in Prisma: `camelCase`

## Error Handling

```typescript
// Backend: Always use NestJS built-in exceptions
throw new NotFoundException(`Work order ${id} not found`);
throw new ForbiddenException('You can only view your own work orders');

// Frontend: Always handle loading + error + empty states
if (isLoading) return <Skeleton />;
if (error) return <ErrorState message="Failed to load" />;
if (!data?.length) return <EmptyState />;
```

## CallSphere Reference Policy

CallSphere is a **reference for patterns**, NOT a codebase to copy from.

### How to use CallSphere
1. **Look at structure** — how modules, guards, and services are organized
2. **Evaluate the pattern** — is it the best approach, or just "a" approach?
3. **Research best practices** — always check NestJS docs, security guides, and current best practices BEFORE adopting a CallSphere pattern
4. **Write fresh code** — implement from scratch using OPSLY's own design patterns
5. **Never blindly copy** — CallSphere may contain bugs, outdated patterns, or suboptimal code

### Decision flow
```
Need to build a module?
  ├── Glance at CallSphere → understand the structural approach
  ├── Check NestJS docs + best practices → is there a better way?
  ├── Align with OPSLY PRD → does our data model differ?
  └── Write optimized, secure code from scratch → own it fully
```

### What to borrow
- Module folder structure (controller → service → dto pattern)
- Guard/decorator composition approach
- WebSocket channel naming conventions

### What to NOT borrow
- Business logic (logistics ≠ property management)
- Raw Prisma queries (may be unoptimized or missing indexes)
- Error handling (may be incomplete)
- Any hardcoded values or env patterns
- Security shortcuts (always validate independently)

## Pre-Completion Checklist

Before marking work complete, verify:

- [ ] Functions < 50 lines
- [ ] Files < 800 lines
- [ ] Nesting <= 4 levels
- [ ] Descriptive naming (no `temp`, `data`, `info`)
- [ ] Error handling present
- [ ] No `console.log` (use NestJS Logger on backend)
- [ ] No hardcoded values (use ConfigService / env vars)
- [ ] No TODO comments left behind
- [ ] TypeScript types complete (no `any`)
- [ ] Imports organized and minimal
- [ ] DTOs validated with class-validator
- [ ] Guards applied on all controller endpoints
