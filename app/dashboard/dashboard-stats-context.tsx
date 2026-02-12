"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type DashboardStats = {
  credits: number;
  scriptsCount: number;
  videosCount: number;
} | null;

const DashboardStatsContext = createContext<{
  stats: DashboardStats;
  setStats: (stats: DashboardStats) => void;
}>({ stats: null, setStats: () => {} });

export function DashboardStatsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<DashboardStats>(null);
  return (
    <DashboardStatsContext.Provider value={{ stats, setStats }}>
      {children}
    </DashboardStatsContext.Provider>
  );
}

export function useDashboardStats() {
  return useContext(DashboardStatsContext);
}
