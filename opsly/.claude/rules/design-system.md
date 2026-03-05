# OPSLY Design System — Liquid Crystal

## Aesthetic Direction
- **Style**: Glassmorphism / frosted glass over gradient backgrounds
- **Mood**: Clean, premium, airy — like a modern property management command center
- **Modes**: Light (default) + Dark (follows system preference)

## Background
- NEVER use flat/solid backgrounds on the page
- ALWAYS use the `var(--page-gradient)` for the page body
- Light: clean white-blue crystal gradient (`#E8EFF7` → `#EEF2F6` → `#F0F4F8`)
- Dark: deep blue-slate gradient (`#0A0F1E` → `#111827` → `#0F172A`)

## Cards
- ALWAYS use `.glass-card` for standard cards (translucent + backdrop-blur + inset highlight)
- Use `.glass-card-heavy` for cards that need more opacity (forms, modals)
- Use `.glass-card-featured` for highlighted/hero cards (gradient fill)
- Use `.glass-strip` for inline containers (filter bars, toolbars — lighter weight)
- All glass cards include `saturate()` for richer colors through the frosted glass
- All glass cards include `var(--glass-inset)` — a subtle top-edge white shimmer
- Border radius: `20px` for cards, `16px` for strips, `12px` for inner elements, `999px` for pills
- Shadows: Multi-layer diffused — never single hard drop shadows

## Color Usage

### Primary
- `#2563EB` (blue-600) — buttons, active nav pills, chart bars, links
- `#1D4ED8` (blue-700) — hover states
- `#3B82F6` (blue-500) — lighter interactive elements

### Accents (blue-spectrum only — no purple/pink/magenta)
- Sky `#0EA5E9` — secondary charts, data series
- Cyan `#06B6D4` — tertiary data, chart variety
- Teal `#6EE7B7` — positive trends, success accents
- Coral `#F87171` — alert accents (distinct from urgent status)
- Slate `#64748B` — neutral accents, muted indicators

### Semantic Status (work order priorities — NEVER change these)
- Urgent: `text-opsly-urgent` / `bg-opsly-urgent` (`#EF4444` red)
- High: `text-opsly-high` / `bg-opsly-high` (`#F59E0B` amber)
- Medium: `text-opsly-medium` / `bg-opsly-medium` (`#3B82F6` blue)
- Low: `text-opsly-low` / `bg-opsly-low` (`#10B981` green)

### Text Hierarchy
- Headings: `text-foreground` (slate-900 light / slate-100 dark)
- Body: `text-secondary-foreground` (#334155 light / #CBD5E1 dark)
- Muted: `text-muted-foreground` (#64748B light / #64748B dark)
- Use shadcn `text-foreground`, `text-muted-foreground` classes

## Typography
- **UI font**: `DM Sans` — all headings, labels, body text
- **Monospace**: `JetBrains Mono` — work order numbers, IDs, metrics, timestamps
- Apply monospace via `.font-mono` utility class
- Heading weights: 700 (bold) for h1-h2, 600 (semibold) for h3-h4
- Body weight: 500 (medium) for labels, 400 (regular) for paragraphs

## Component Patterns

### Navigation
```
.glass-nav for top bar
.pill-active for current route
.pill-inactive for other routes
```

### KPI Cards
```
.glass-card or .glass-card-featured for hero metrics
Large number in .font-mono font-bold
Subtle label below in text-muted-foreground
```

### Data Tables
```
.glass-card container with overflow-hidden
Table headers: text-muted-foreground uppercase text-xs tracking-wider
Table rows: border-b border-border, hover:bg-accent transition
```

### Status Badges
```
Rounded-full pills with priority color bg at 10-15% opacity + text in full color
Example: bg-opsly-urgent/10 text-opsly-urgent for URGENT
Always include text label — never rely on color alone
```

### Modals / Dialogs
```
.glass-card-heavy for modal body
Backdrop: bg-black/20 backdrop-blur-sm
```

### Charts
```
chart-1 through chart-5 for data series
Use blue as primary chart color
Sky and cyan for secondary/tertiary series (no purple/magenta)
```

## Gradients

### Featured card gradient (blue → sky → white, subtle)
```css
background: var(--gradient-featured);
```

### Warm gradient (sky → cyan → teal, clean — use sparingly)
```css
background: var(--gradient-warm);
```

## Spacing & Layout
- Page padding: `px-6 py-6` on desktop, `px-4 py-4` on mobile
- Card padding: `p-6` standard, `p-8` for hero cards
- Grid gap: `gap-6` between cards
- Dashboard grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-4` for KPI cards

## Animations
- Card hover: `transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`
- Data updates: Fade in via `animate-in fade-in duration-300`
- Status changes: Subtle pulse for attention
- NEVER use flashy/bouncy animations — keep it professional

## What NOT to Do
- No flat solid backgrounds on pages
- No sharp corners on cards (always rounded-2xl or rounded-3xl)
- No hard drop shadows
- No gradients on data elements (tables, lists) — reserve for hero cards only
- No neon/bright colors outside the semantic status palette
- No dark-only designs — always support both modes
