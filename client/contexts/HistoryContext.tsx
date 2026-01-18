import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { getWorkoutHistory, addWorkoutToHistory, clearWorkoutHistory, removeWorkoutFromHistory, WorkoutHistoryEntry } from "@/lib/storage";

interface HistoryContextType {
  history: WorkoutHistoryEntry[];
  isLoading: boolean;
  addEntry: (entry: Omit<WorkoutHistoryEntry, "id" | "timestamp" | "date">) => Promise<void>;
  clearHistory: () => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  refreshHistory: () => Promise<void>;
}

const HistoryContext = createContext<HistoryContextType | null>(null);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    const loaded = await getWorkoutHistory();
    setHistory(loaded);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const addEntry = useCallback(async (entry: Omit<WorkoutHistoryEntry, "id" | "timestamp" | "date">) => {
    await addWorkoutToHistory(entry);
    await loadHistory();
  }, [loadHistory]);

  const clearHistory = useCallback(async () => {
    await clearWorkoutHistory();
    setHistory([]);
  }, []);

  const removeEntry = useCallback(async (id: string) => {
    await removeWorkoutFromHistory(id);
    await loadHistory();
  }, [loadHistory]);

  const refreshHistory = useCallback(async () => {
    await loadHistory();
  }, [loadHistory]);

  if (isLoading) return null;

  return (
    <HistoryContext.Provider value={{ history, isLoading, addEntry, clearHistory, removeEntry, refreshHistory }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory(): HistoryContextType {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }
  return context;
}
