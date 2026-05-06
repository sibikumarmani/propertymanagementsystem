"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type AppState = {
  selectedProjectId: string;
  accessToken: string | null;
  refreshToken: string | null;
  pendingCompanySelectionToken: string | null;
  availableCompanies: Array<{
    id: number;
    companyName: string;
    companyCode?: string | null;
    defaultCompany: boolean;
  }>;
  hasHydrated: boolean;
  user: {
    id: number;
    userCode?: string;
    fullName: string;
    email: string;
    phone?: string | null;
    roles: string[];
    menuAccessKeys: string[];
    activeCompany?: {
      id: number;
      companyName: string;
      companyCode?: string | null;
    } | null;
    avatarImage?: string | null;
  } | null;
  setSelectedProjectId: (projectId: string) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  setAuth: (payload: {
    accessToken: string | null;
    refreshToken: string | null;
    user: {
      id: number;
      userCode?: string;
      fullName: string;
      email: string;
      phone?: string | null;
      roles: string[];
      menuAccessKeys: string[];
      activeCompany?: {
        id: number;
        companyName: string;
        companyCode?: string | null;
      } | null;
      avatarImage?: string | null;
    };
  }) => void;
  setPendingCompanySelection: (payload: {
    companySelectionToken: string;
    availableCompanies: Array<{
      id: number;
      companyName: string;
      companyCode?: string | null;
      defaultCompany: boolean;
    }>;
    user: NonNullable<AppState["user"]>;
  }) => void;
  updateUser: (payload: Partial<NonNullable<AppState["user"]>>) => void;
  clearAuth: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedProjectId: "p1",
      accessToken: null,
      refreshToken: null,
      pendingCompanySelectionToken: null,
      availableCompanies: [],
      hasHydrated: false,
      user: null,
      setSelectedProjectId: (selectedProjectId) => set({ selectedProjectId }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setAuth: ({ accessToken, refreshToken, user }) =>
        set({
          accessToken,
          refreshToken,
          user,
          pendingCompanySelectionToken: null,
          availableCompanies: [],
        }),
      setPendingCompanySelection: ({ companySelectionToken, availableCompanies, user }) =>
        set({
          accessToken: null,
          refreshToken: null,
          pendingCompanySelectionToken: companySelectionToken,
          availableCompanies,
          user,
        }),
      updateUser: (payload) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                ...payload,
              }
            : state.user,
        })),
      clearAuth: () =>
        set({
          accessToken: null,
          refreshToken: null,
          pendingCompanySelectionToken: null,
          availableCompanies: [],
          user: null,
        }),
    }),
    {
      name: "pms-auth-store",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        selectedProjectId: state.selectedProjectId,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        pendingCompanySelectionToken: state.pendingCompanySelectionToken,
        availableCompanies: state.availableCompanies,
        user: state.user,
      }),
    },
  ),
);
