# OPSLY Shared UI Components

## Source: `frontend/src/components/ui/`

### badge.tsx (48 lines)
```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary: "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive: "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline: "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function Badge({ className, variant, asChild = false, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"
  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}
export { Badge, badgeVariants }
```

### button.tsx (64 lines) — shadcn/ui Button with variants: default, destructive, outline, secondary, ghost, link. Sizes: default, sm, lg, icon.

### table.tsx (116 lines) — shadcn/ui Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption, TableFooter components.

### dialog.tsx (156 lines) — shadcn/ui Dialog, DialogPortal, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose.

### select.tsx (188 lines) — shadcn/ui Select, SelectTrigger, SelectContent, SelectItem, SelectValue, etc.

### scroll-area.tsx (56 lines) — shadcn/ui ScrollArea + ScrollBar.

### separator.tsx (28 lines) — shadcn/ui Separator (horizontal/vertical).

### input.tsx (21 lines) — shadcn/ui Input with standard styling.

### tooltip.tsx (57 lines) — shadcn/ui Tooltip, TooltipTrigger, TooltipContent.

### card.tsx (92 lines) — shadcn/ui Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction.

## Dashboard-Specific Components

### PriorityBadge (36 lines)
Priority color-coded badge using semantic colors. Maps Priority enum → bg/text/border classes.
- URGENT: red, HIGH: amber, MEDIUM: blue, LOW: green

### StatusBadge (66 lines)
Work order status badge with dot indicator. Maps WorkOrderStatus enum → color classes.

### SlaCountdown (61 lines)
Client-side countdown from `slaDeadline` timestamp. Shows "Breached" (red pulse), critical time (amber), or normal countdown (mono text).

### KpiCards (108 lines)
4 hero metric cards with animated glow borders (`.glow-card`). Variants: default (blue), urgent (red), active (blue), success (green).

### FilterBar (123 lines)
`.glass-strip` container with 4 Select dropdowns (Property, Status, Priority, Technician) + Clear button.

### WorkOrderTable (155 lines)
`.glass-card` container with shadcn Table. Columns: Order#, Unit, Issue, Priority, Status, Assigned, SLA, Reported.

### WorkOrderDetail (276 lines)
Detail panel with header, description, meta, AI assessment card, severity bar, event timeline.

### EscalationFeed (135 lines)
Scrollable list of active SLA breach escalations with acknowledge buttons.

### TechnicianPanel (113 lines)
Scrollable list of technicians with status dots and job count badges.

### AssignTechnicianModal (159 lines)
Dialog to select and assign a technician to a work order. Shows workload dots.
