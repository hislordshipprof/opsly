# React Frontend Skill — OPSLY

## Purpose

Defines how to build all frontend views for OPSLY: tenant portal, manager command center, technician view, and voice widgets.

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **Styling**: TailwindCSS
- **Components**: shadcn/ui
- **State**: TanStack Query (server state) + Zustand (UI state)
- **WebSocket**: Socket.IO Client
- **Forms**: React Hook Form + Zod
- **Routing**: React Router v6

## Design Tokens (OPSLY Industrial Theme)
```css
--opsly-bg:        #0A0F1E;
--opsly-surface:   #111827;
--opsly-border:    #1F2937;
--opsly-text:      #F9FAFB;
--opsly-muted:     #6B7280;
--opsly-urgent:    #EF4444;
--opsly-high:      #F59E0B;
--opsly-medium:    #3B82F6;
--opsly-low:       #10B981;
--opsly-accent:    #6366F1;
```

Font pairing: 'DM Sans' (UI) + 'JetBrains Mono' (codes/numbers)

## Data Fetching (TanStack Query)
```typescript
// Query keys as constants
export const QUERY_KEYS = {
  workOrders: (filters?: Filters) => ['work-orders', filters],
  workOrder: (id: string) => ['work-orders', id],
  schedule: (date: string) => ['schedules', date],
  metrics: () => ['metrics', 'overview'],
} as const;

// No polling — WebSocket handles real-time updates
const { data, isLoading, error } = useQuery({
  queryKey: QUERY_KEYS.workOrders(filters),
  queryFn: () => api.workOrders.getAll(filters),
  refetchInterval: false,
});
```

## WebSocket Integration
```typescript
// Central hook — never raw Socket.IO in components
const { isConnected } = useWebSocket();

// Subscribe to specific events, update TanStack cache directly
useWorkOrderEvents((event) => {
  queryClient.setQueryData(QUERY_KEYS.workOrders(), (old) =>
    updateWorkOrderInList(old, event)
  );
});
```

## Component Pattern
```typescript
interface WorkOrderCardProps {
  workOrder: WorkOrder;
  onAssign?: (id: string) => void;
}

export function WorkOrderCard({ workOrder, onAssign }: WorkOrderCardProps) {
  // 1. Hooks at top
  // 2. Derived values
  // 3. Event handlers
  // 4. Return JSX with loading/error/empty states
}
```

## Route Structure
```
/login, /register
/tenant, /tenant/report, /tenant/orders, /tenant/orders/:id
/technician, /technician/schedule, /technician/voice, /technician/orders/:id
/manager, /manager/orders, /manager/orders/:id, /manager/technicians,
  /manager/escalations, /manager/metrics
/admin, /admin/users, /admin/properties, /admin/metrics, /admin/escalations
```

## VoiceWidget Rules
- Fully self-contained component (no parent state)
- Always show connection state: idle → connecting → active → ended
- Always show live transcript scrolling
- Always provide text fallback if mic denied
- PhotoUploadTrigger appears only when agent requests it
