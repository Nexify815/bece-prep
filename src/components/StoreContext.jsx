import { createContext, useContext } from "react";

// Provides the current equipped skin + theme and store actions.
// Backed by App state so purchases/equips persist via the normal save cycle.
export const StoreContext = createContext(null);

export function useStore() {
  return useContext(StoreContext);
}
