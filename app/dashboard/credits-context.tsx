"use client";

import { createContext, useContext, type ReactNode } from "react";

const CreditsContext = createContext<number | null>(null);

export function CreditsProvider({
  credits,
  children,
}: {
  credits: number | null;
  children: ReactNode;
}) {
  return (
    <CreditsContext.Provider value={credits}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  return useContext(CreditsContext);
}
