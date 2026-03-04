import { create } from 'zustand';
import type { WorkOrderStatus, Priority } from '@/types';

interface DashboardFilters {
  propertyId: string | null;
  status: WorkOrderStatus | null;
  priority: Priority | null;
  assignedToId: string | null;
}

interface DashboardState {
  // Filters for the work order table
  filters: DashboardFilters;
  setFilter: <K extends keyof DashboardFilters>(
    key: K,
    value: DashboardFilters[K],
  ) => void;
  clearFilters: () => void;

  // Selected work order for detail panel
  selectedWorkOrderId: string | null;
  selectWorkOrder: (id: string | null) => void;

  // Assign technician modal
  assignModalOrderId: string | null;
  openAssignModal: (workOrderId: string) => void;
  closeAssignModal: () => void;
}

const DEFAULT_FILTERS: DashboardFilters = {
  propertyId: null,
  status: null,
  priority: null,
  assignedToId: null,
};

export const useDashboardStore = create<DashboardState>((set) => ({
  filters: { ...DEFAULT_FILTERS },
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  clearFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),

  selectedWorkOrderId: null,
  selectWorkOrder: (id) => set({ selectedWorkOrderId: id }),

  assignModalOrderId: null,
  openAssignModal: (workOrderId) => set({ assignModalOrderId: workOrderId }),
  closeAssignModal: () => set({ assignModalOrderId: null }),
}));
