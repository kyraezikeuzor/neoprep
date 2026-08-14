"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type PracticeSessionContextValue = {
  practiceActive: boolean;
  setPracticeActive: (active: boolean) => void;
};

const PracticeSessionContext = createContext<PracticeSessionContextValue | null>(
  null
);

export function PracticeSessionProvider({ children }: { children: ReactNode }) {
  const [practiceActive, setPracticeActiveState] = useState(false);
  const setPracticeActive = useCallback((active: boolean) => {
    setPracticeActiveState(active);
  }, []);

  const value = useMemo(
    () => ({ practiceActive, setPracticeActive }),
    [practiceActive, setPracticeActive]
  );

  return (
    <PracticeSessionContext.Provider value={value}>
      {children}
    </PracticeSessionContext.Provider>
  );
}

export function usePracticeSession() {
  const ctx = useContext(PracticeSessionContext);
  if (!ctx) {
    return {
      practiceActive: false,
      setPracticeActive: (_active: boolean) => {},
    };
  }
  return ctx;
}
