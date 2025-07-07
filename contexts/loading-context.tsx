"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { LoadingPage } from "@/components/ui/loading-page";

interface LoadingState {
  isPageLoading: boolean;
  loadingMessage: string;
  loadingOperations: Set<string>;
}

interface LoadingContextType {
  isPageLoading: boolean;
  loadingMessage: string;
  isOperationLoading: (operation: string) => boolean;
  startPageLoading: (message?: string) => void;
  stopPageLoading: () => void;
  startOperation: (operation: string) => void;
  stopOperation: (operation: string) => void;
  isAnyLoading: () => boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isPageLoading: false,
    loadingMessage: "Loading...",
    loadingOperations: new Set(),
  });

  const startPageLoading = useCallback((message = "Loading...") => {
    setLoadingState((prev) => ({
      ...prev,
      isPageLoading: true,
      loadingMessage: message,
    }));
  }, []);

  const stopPageLoading = useCallback(() => {
    setLoadingState((prev) => ({
      ...prev,
      isPageLoading: false,
    }));
  }, []);

  const startOperation = useCallback((operation: string) => {
    setLoadingState((prev) => ({
      ...prev,
      loadingOperations: new Set([...prev.loadingOperations, operation]),
    }));
  }, []);

  const stopOperation = useCallback((operation: string) => {
    setLoadingState((prev) => {
      const newOperations = new Set(prev.loadingOperations);
      newOperations.delete(operation);
      return {
        ...prev,
        loadingOperations: newOperations,
      };
    });
  }, []);

  const isOperationLoading = useCallback(
    (operation: string) => {
      return loadingState.loadingOperations.has(operation);
    },
    [loadingState.loadingOperations]
  );

  const isAnyLoading = useCallback(() => {
    return (
      loadingState.isPageLoading || loadingState.loadingOperations.size > 0
    );
  }, [loadingState.isPageLoading, loadingState.loadingOperations.size]);

  const value: LoadingContextType = {
    isPageLoading: loadingState.isPageLoading,
    loadingMessage: loadingState.loadingMessage,
    isOperationLoading,
    startPageLoading,
    stopPageLoading,
    startOperation,
    stopOperation,
    isAnyLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {loadingState.isPageLoading && (
        <LoadingPage message={loadingState.loadingMessage} />
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}

export function useNavigationLoading() {
  const { startPageLoading, stopPageLoading } = useLoading();

  const withLoadingNavigation = useCallback(
    async (navigationFn: () => Promise<void> | void, message?: string) => {
      startPageLoading(message);
      try {
        await navigationFn();
      } finally {
        setTimeout(() => {
          stopPageLoading();
        }, 300);
      }
    },
    [startPageLoading, stopPageLoading]
  );

  return { withLoadingNavigation };
}

export function useOperationLoading() {
  const { startOperation, stopOperation, isOperationLoading } = useLoading();

  const withLoadingOperation = useCallback(
    (operation: string, operationFn: () => Promise<any>) => {
      startOperation(operation);
      return operationFn().finally(() => {
        stopOperation(operation);
      });
    },
    [startOperation, stopOperation]
  );

  return { withLoadingOperation, isOperationLoading };
}
