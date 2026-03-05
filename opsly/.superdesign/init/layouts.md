# OPSLY Layouts

## Navigation / Header

There is no shared layout component — each page renders its own header inline.

### Manager Dashboard Header (inline in ManagerDashboardPage.tsx)

```tsx
<header className="glass-nav sticky top-0 z-30 px-6 py-3.5">
  <div className="max-w-[1600px] mx-auto flex items-center justify-between">
    <div className="flex items-center gap-8">
      <h1 className="text-lg font-bold tracking-tight select-none">OPSLY</h1>
      <nav className="hidden md:flex items-center gap-1">
        <span className="pill-active">Dashboard</span>
      </nav>
    </div>
    <div className="flex items-center gap-5">
      {/* Connection indicator */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/40">
        <span className={`size-2 rounded-full ${isConnected ? 'bg-opsly-low' : 'bg-opsly-urgent animate-pulse'}`} />
        <span className="text-xs font-medium text-muted-foreground">
          {isConnected ? 'Live' : 'Connecting...'}
        </span>
      </div>
      <div className="h-5 w-px bg-border" />
      {/* User info */}
      <div className="flex items-center gap-2.5">
        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/5">
          <span className="text-xs font-semibold text-primary">
            {user?.email?.charAt(0).toUpperCase() ?? 'M'}
          </span>
        </div>
        <span className="text-sm font-medium hidden sm:inline">
          {user?.email?.split('@')[0] ?? 'Manager'}
        </span>
      </div>
    </div>
  </div>
</header>
```

### Login/Signup Layout (split-screen)

```tsx
<main className="flex min-h-screen">
  {/* Left — Brand gradient panel (hidden on mobile) */}
  <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] flex-col justify-between p-12">
    {/* Floating circles + brand text */}
  </div>
  {/* Right — Form */}
  <div className="flex-1 flex items-center justify-center bg-background px-6">
    {/* Form content */}
  </div>
</main>
```
