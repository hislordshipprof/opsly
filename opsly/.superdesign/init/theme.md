# OPSLY Theme & Design Tokens

## Build: Tailwind CSS v4 via `@tailwindcss/vite` plugin (no tailwind.config file)
## All tokens defined in `frontend/src/index.css`

## Fonts
- UI: `DM Sans`, `Plus Jakarta Sans`, system-ui, sans-serif
- Monospace: `JetBrains Mono`, `IBM Plex Mono`, ui-monospace, monospace
- Mono class: `.font-mono`

## Color Tokens (@theme block)
```css
--color-opsly-urgent: #EF4444;  /* Red — urgent priority */
--color-opsly-high: #F59E0B;    /* Amber — high priority */
--color-opsly-medium: #3B82F6;  /* Blue — medium priority */
--color-opsly-low: #10B981;     /* Green — low priority */
--color-opsly-sky: #0EA5E9;
--color-opsly-cyan: #06B6D4;
--color-opsly-teal: #6EE7B7;
--color-opsly-coral: #F87171;
--color-opsly-slate: #64748B;
```

## Light Mode (:root)
```css
--background: #EEF2F6;
--foreground: #0F172A;
--card: rgba(255, 255, 255, 0.80);
--primary: #2563EB;
--primary-foreground: #FFFFFF;
--secondary: #F5F8FC;
--muted-foreground: #64748B;
--border: rgba(0, 0, 0, 0.06);
--glass-bg: rgba(255, 255, 255, 0.65);
--glass-bg-heavy: rgba(255, 255, 255, 0.85);
--glass-border: rgba(255, 255, 255, 0.70);
--glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04);
--glass-inset: inset 0 1px 0 rgba(255, 255, 255, 0.80);
--page-gradient: linear-gradient(145deg, #E8EFF7 0%, #EEF2F6 40%, #F0F4F8 70%, #EEF2F6 100%);
```

## Dark Mode (.dark)
```css
--background: #0B1120;
--foreground: #F1F5F9;
--card: rgba(17, 24, 39, 0.80);
--primary: #3B82F6;
--glass-bg: rgba(17, 24, 39, 0.60);
--glass-border: rgba(255, 255, 255, 0.10);
--page-gradient: linear-gradient(135deg, #0A0F1E 0%, #111827 40%, #0F172A 100%);
```

## Glass Card Classes
- `.glass-card` — Standard card (24px blur, saturate 1.4, 20px radius)
- `.glass-card-heavy` — Modal/form card (32px blur, higher opacity)
- `.glass-card-featured` — Hero card with gradient fill
- `.glass-nav` — Top navigation bar
- `.glass-strip` — Lightweight container (filter bars)
- `.glow-card` — Animated rotating conic-gradient border (KPI cards)
- `.pill-active` / `.pill-inactive` — Nav pills

## Border Radius Convention
- Cards: 20px
- Strips: 16px
- Inner elements: 12px (rounded-xl)
- Pills/badges: 999px (rounded-full)

## Shadows: Multi-layer diffused, never hard drop shadows.
