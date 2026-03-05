# OPSLY Routes

## Router: React Router v6 (BrowserRouter)
## File: `frontend/src/App.tsx`

| Path | Component | Access | Layout |
|------|-----------|--------|--------|
| `/login` | `LoginPage` | Public | Split-screen (brand panel + form) |
| `/signup` | `SignupPage` | Public | Split-screen (brand panel + form) |
| `/manager` | `ManagerDashboardPage` | MANAGER, ADMIN | Full-page with glass-nav header |
| `/technician` | `TechnicianDashboardPage` | TECHNICIAN | Full-page with glass-nav header |
| `/tenant/report` | `TenantReportPage` | TENANT | Minimal with voice widget |
| `*` | `RoleRedirect` | Authenticated | Redirects to role dashboard |

## Auth: `ProtectedRoute` wrapper checks JWT token + role match, redirects to `/login` if unauthorized.
