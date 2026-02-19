/**
 * CoffeePOS - Shift Store (Zustand)
 *
 * Global state management for shift lifecycle
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { shiftsApi, type Shift, type ShiftOpenData, type ShiftCloseData } from '@/lib/api';

// ============================================
// TYPES
// ============================================

export interface ShiftState {
  currentShift: Shift | null;
  isShiftLoading: boolean;
  shiftError: string | null;

  // Actions
  fetchCurrentShift: () => Promise<void>;
  openShift: (openingCash: number, openedBy: string) => Promise<boolean>;
  closeShift: (closingCash: number, closedBy: string, notes?: string) => Promise<boolean>;

  // Computed
  isShiftOpen: () => boolean;
  getShiftDuration: () => number;
  shouldRemindToClose: () => boolean;
}

// ============================================
// STORE
// ============================================

export const useShiftStore = create<ShiftState>()(
  devtools(
    persist(
      (set, get) => ({
        currentShift: null,
        isShiftLoading: false,
        shiftError: null,

        fetchCurrentShift: async () => {
          set({ isShiftLoading: true, shiftError: null }, false, 'fetchCurrentShift');
          try {
            const response = await shiftsApi.getCurrent();
            set({ currentShift: response.data, isShiftLoading: false }, false, 'fetchCurrentShift/success');
          } catch {
            set({ isShiftLoading: false }, false, 'fetchCurrentShift/error');
          }
        },

        openShift: async (openingCash: number, openedBy: string) => {
          set({ isShiftLoading: true, shiftError: null }, false, 'openShift');
          try {
            const response = await shiftsApi.open({ openingCash, openedBy });
            set({ currentShift: response.data, isShiftLoading: false }, false, 'openShift/success');
            return true;
          } catch (error: any) {
            set({ isShiftLoading: false, shiftError: error.message || 'Failed to open shift' }, false, 'openShift/error');
            return false;
          }
        },

        closeShift: async (closingCash: number, closedBy: string, notes?: string) => {
          const { currentShift } = get();
          if (!currentShift) return false;

          set({ isShiftLoading: true, shiftError: null }, false, 'closeShift');
          try {
            await shiftsApi.close(currentShift.documentId, { closingCash, closedBy, notes });
            set({ currentShift: null, isShiftLoading: false }, false, 'closeShift/success');
            return true;
          } catch (error: any) {
            set({ isShiftLoading: false, shiftError: error.message || 'Failed to close shift' }, false, 'closeShift/error');
            return false;
          }
        },

        isShiftOpen: () => {
          return get().currentShift?.status === 'open';
        },

        getShiftDuration: () => {
          const { currentShift } = get();
          if (!currentShift) return 0;
          return Date.now() - new Date(currentShift.openedAt).getTime();
        },

        shouldRemindToClose: () => {
          const duration = get().getShiftDuration();
          return duration > 22 * 60 * 60 * 1000; // 22 hours
        },
      }),
      {
        name: 'paradise-pos-shift',
        partialize: (state) => ({
          currentShift: state.currentShift,
        }),
      }
    ),
    { name: 'ShiftStore' }
  )
);

export const selectCurrentShift = (state: ShiftState) => state.currentShift;
export const selectIsShiftLoading = (state: ShiftState) => state.isShiftLoading;
