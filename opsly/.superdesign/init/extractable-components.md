# OPSLY Extractable Components

## Layout Components (high reuse)

### 1. DashboardHeader
- Source: `ManagerDashboardPage.tsx` lines 29-65
- Props: `isConnected: boolean`, `userInitial: string`, `userName: string`
- Used in: ManagerDashboardPage, TechnicianDashboardPage

### 2. GlowCard
- Source: `index.css` (.glow-card classes) + `KpiCards.tsx`
- Props: `variant: 'default' | 'urgent' | 'active' | 'success'`
- Used in: KpiCards

## Data Display Components

### 3. PriorityBadge
- Source: `PriorityBadge.tsx`
- Props: `priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'`
- Used in: WorkOrderTable, WorkOrderDetail

### 4. StatusBadge
- Source: `StatusBadge.tsx`
- Props: `status: WorkOrderStatus`
- Used in: WorkOrderTable, WorkOrderDetail

### 5. SlaCountdown
- Source: `SlaCountdown.tsx`
- Props: `slaDeadline: string | null`, `slaBreached: boolean`
- Used in: WorkOrderTable, WorkOrderDetail, EscalationFeed

## Skip (too simple / shadcn primitives)
- Button, Input, Badge, Table, Dialog, Select, ScrollArea, Separator, Tooltip, Card
