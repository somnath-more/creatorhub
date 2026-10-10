import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { AuthClient, authClient } from "./authClient";
import { AuthContext } from "./authContext";

export function AuthProvider({ children, client = authClient }: { children: ReactNode; client?: AuthClient }) {
  const state = useSyncExternalStore(client.subscribe, client.getSnapshot, client.getSnapshot);
  useEffect(() => { void client.bootstrap(); }, [client]);
  return <AuthContext.Provider value={{ state, client }}>{children}</AuthContext.Provider>;
}
