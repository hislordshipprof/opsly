# OPSLY Design System — Liquid Crystal / Glassmorphism

## Product Context
AI-powered property management platform. Manager command center with real-time KPIs, work order tracking, SLA countdowns, and technician management.

## Aesthetic Direction
- **Style**: Glassmorphism / frosted glass over gradient backgrounds
- **Mood**: Clean, premium, airy — like a modern property management command center
- **Modes**: Light (default) + Dark (follows system preference)

## Typography
- **UI Font**: `DM Sans`, `Plus Jakarta Sans`, system-ui, sans-serif
- **Monospace**: `JetBrains Mono`, `IBM Plex Mono` — for IDs, order numbers, metrics, timestamps
- **Heading weights**: 700 bold (h1-h2), 600 semibold (h3-h4)
- **Body weight**: 500 medium (labels), 400 regular (paragraphs)
- **Label style**: `text-[10px] font-bold uppercase tracking-[0.2em]` for form labels
- **Table headers**: `text-[11px] uppercase tracking-widest font-semibold`

## Color Palette

### Primary
- `#2563EB` (blue-600) — buttons, active nav, chart bars, links
- `#1D4ED8` (blue-700) — hover states
- `#3B82F6` (blue-500) — lighter interactive

### Semantic Status (NEVER change)
- Urgent: `#EF4444` (red)
- High: `#F59E0B` (amber)
- Medium: `#3B82F6` (blue)
- Low: `#10B981` (green)

### Accents (blue-spectrum only — NO purple/pink/magenta)
- Sky: `#0EA5E9`
- Cyan: `#06B6D4`
- Teal: `#6EE7B7`
- Coral: `#F87171`
- Slate: `#64748B`

### Light Mode Surfaces
- Background: `#EEF2F6`
- Page gradient: `linear-gradient(145deg, #E8EFF7 0%, #EEF2F6 40%, #F0F4F8 70%, #EEF2F6 100%)`
- Card: `rgba(255, 255, 255, 0.65)` with 24px blur
- Glass border: `rgba(255, 255, 255, 0.70)`
- Text primary: `#0F172A`
- Text muted: `#64748B`

### Dark Mode Surfaces
- Background: `#0B1120`
- Page gradient: `linear-gradient(135deg, #0A0F1E 0%, #111827 40%, #0F172A 100%)`
- Card: `rgba(17, 24, 39, 0.60)` with 24px blur
- Glass border: `rgba(255, 255, 255, 0.10)`

## Layout
- Max content width: `1600px`
- Page padding: `px-6 py-6`
- Card padding: `p-6` standard
- Grid gap: `gap-6`
- KPI grid: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4`
- Main grid: `grid-cols-1 xl:grid-cols-[1fr_340px]`

## Card System
- `.glass-card` — Standard: 24px blur, saturate(1.4), 20px radius, multi-layer shadow
- `.glass-card-heavy` — Modals: 32px blur, higher opacity
- `.glass-card-featured` — Hero: gradient fill
- `.glass-strip` — Filter bars: 16px radius, lighter weight
- `.glow-card` — KPI cards: animated conic-gradient rotating border with soft glow
- Always include inset top highlight (`inset 0 1px 0 rgba(255,255,255,0.80)`)

## Border Radius
- Cards: `20px` (rounded-[20px])
- Strips: `16px` (rounded-2xl)
- Inner elements: `12px` (rounded-xl)
- Inputs: `16px` (rounded-2xl)
- Pills/badges: `999px` (rounded-full)
- Glow card outer: `22px`, inner: `20px`

## Shadows
- Standard: `0 8px 32px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)`
- Large: `0 12px 48px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)`
- Always multi-layer diffused — NEVER single hard drop shadows

## Animations
- Card hover: `transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`
- Glow card: `@keyframes glow-spin` 4s linear infinite rotation
- SLA breach: pulse animation on red dot
- Login: staggered slide-up-fade entrance animations
- Shimmer on primary button hover
- NEVER flashy/bouncy — keep professional

## Component Patterns
- Status badges: rounded-full pills, color at 10-15% opacity bg + full color text + border
- KPI cards: large mono number, small label above, subtitle below
- Table: glass-card container, uppercase tracking-wider headers, hover highlight rows
- Filter bar: glass-strip, Select dropdowns with rounded-xl triggers
- Escalation items: red-tinted bg, order number + SLA countdown + acknowledge button

## What NOT to Do
- No flat solid backgrounds on pages
- No sharp corners on cards
- No hard drop shadows
- No gradients on data elements (tables, lists)
- No neon/bright colors outside semantic palette
- No purple, pink, or magenta accents
- No dark-only designs — always support both modes
