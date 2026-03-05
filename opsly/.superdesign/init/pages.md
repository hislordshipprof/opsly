# OPSLY Page Dependency Trees

## /manager — ManagerDashboardPage

```
frontend/src/pages/ManagerDashboardPage.tsx
├── frontend/src/hooks/useWebSocket.ts (useDashboardEvents)
├── frontend/src/stores/dashboardStore.ts
├── frontend/src/hooks/useAuth.tsx
├── frontend/src/components/dashboard/KpiCards.tsx
│   ├── frontend/src/services/api.ts (getDashboardMetrics)
│   └── frontend/src/services/query-keys.ts
├── frontend/src/components/dashboard/FilterBar.tsx
│   ├── frontend/src/stores/dashboardStore.ts
│   ├── frontend/src/components/ui/button.tsx
│   ├── frontend/src/components/ui/select.tsx
│   ├── frontend/src/services/api.ts
│   └── frontend/src/services/query-keys.ts
├── frontend/src/components/dashboard/WorkOrderTable.tsx
│   ├── frontend/src/components/dashboard/PriorityBadge.tsx
│   │   └── frontend/src/components/ui/badge.tsx
│   ├── frontend/src/components/dashboard/StatusBadge.tsx
│   │   └── frontend/src/components/ui/badge.tsx
│   ├── frontend/src/components/dashboard/SlaCountdown.tsx
│   ├── frontend/src/components/ui/table.tsx
│   ├── frontend/src/components/ui/button.tsx
│   ├── frontend/src/stores/dashboardStore.ts
│   ├── frontend/src/services/api.ts
│   └── frontend/src/services/query-keys.ts
├── frontend/src/components/dashboard/WorkOrderDetail.tsx
│   ├── frontend/src/components/dashboard/PriorityBadge.tsx
│   ├── frontend/src/components/dashboard/StatusBadge.tsx
│   ├── frontend/src/components/dashboard/SlaCountdown.tsx
│   ├── frontend/src/components/ui/button.tsx
│   ├── frontend/src/components/ui/scroll-area.tsx
│   ├── frontend/src/components/ui/separator.tsx
│   ├── frontend/src/hooks/useWebSocket.ts
│   ├── frontend/src/stores/dashboardStore.ts
│   ├── frontend/src/services/api.ts
│   └── frontend/src/services/query-keys.ts
├── frontend/src/components/dashboard/EscalationFeed.tsx
│   ├── frontend/src/components/dashboard/SlaCountdown.tsx
│   ├── frontend/src/components/ui/scroll-area.tsx
│   ├── frontend/src/components/ui/button.tsx
│   ├── frontend/src/stores/dashboardStore.ts
│   └── frontend/src/services/api.ts
├── frontend/src/components/dashboard/TechnicianPanel.tsx
│   ├── frontend/src/components/ui/scroll-area.tsx
│   ├── frontend/src/services/api.ts
│   └── frontend/src/services/query-keys.ts
└── frontend/src/components/dashboard/AssignTechnicianModal.tsx
    ├── frontend/src/components/ui/dialog.tsx
    ├── frontend/src/components/ui/button.tsx
    ├── frontend/src/stores/dashboardStore.ts
    ├── frontend/src/services/api.ts
    └── frontend/src/services/query-keys.ts

Global deps:
├── frontend/src/index.css (all design tokens + glass classes)
├── frontend/src/types/index.ts
├── frontend/src/lib/utils.ts (cn helper)
└── frontend/vite.config.ts
```

## /login — LoginPage

```
frontend/src/pages/LoginPage.tsx
├── frontend/src/hooks/useAuth.tsx
├── frontend/src/components/ui/button.tsx
└── frontend/src/services/api.ts (login fn)

Global deps:
├── frontend/src/index.css
└── frontend/src/lib/utils.ts
```

## /signup — SignupPage

```
frontend/src/pages/SignupPage.tsx
├── frontend/src/services/api.ts (register fn)
├── frontend/src/components/ui/button.tsx
└── frontend/src/types/index.ts (Role enum)

Global deps:
├── frontend/src/index.css
└── frontend/src/lib/utils.ts
```

## /technician — TechnicianDashboardPage

```
frontend/src/pages/TechnicianDashboardPage.tsx
├── frontend/src/components/technician/JobQueue.tsx
├── frontend/src/components/technician/JobDetail.tsx
│   └── frontend/src/components/voice/VoiceWidget.tsx
├── frontend/src/hooks/useVoiceSession.ts
├── frontend/src/hooks/useWebSocket.ts
├── frontend/src/hooks/useAuth.tsx
├── frontend/src/services/api.ts
└── frontend/src/services/query-keys.ts
```

## /tenant/report — TenantReportPage

```
frontend/src/pages/TenantReportPage.tsx
└── frontend/src/components/voice/VoiceWidget.tsx
    └── frontend/src/hooks/useVoiceSession.ts
```
