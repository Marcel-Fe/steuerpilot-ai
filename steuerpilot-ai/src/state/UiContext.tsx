import { createContext, useContext } from 'react';

export interface UiContextValue {
  openReceiptModal: () => void;
  openMenu: () => void;
}

export const UiContext = createContext<UiContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useUi(): UiContextValue {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi must be used within Layout');
  return ctx;
}
