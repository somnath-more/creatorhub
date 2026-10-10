import { createContext, useContext } from "react";
import { AuthClient, type AuthState } from "./authClient";
export const AuthContext = createContext<{ state: AuthState; client: AuthClient } | null>(null);
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("Authentication provider is missing.");
  return value;
}
