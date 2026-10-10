import type { ReactNode } from 'react';
import { AuthContext } from '../features/auth/authContext';
import { authClient, type AuthState } from '../features/auth/authClient';
import { setAccountScope } from '../features/auth/accountScope';
const state: AuthState = { status: 'authenticated', session: {
  accessToken: 'local-demo-only', tokenType: 'Bearer', expiresIn: 900,
  creator: { userId: 'vercel-demo', creatorId: 'vercel-demo', fullName: 'Demo Creator', email: 'demo@example.com', emailVerified: true },
} };
export function DemoProvider({ children }: { children: ReactNode }) {
  setAccountScope('vercel-demo');
  return <AuthContext.Provider value={{ state, client: authClient }}>{children}</AuthContext.Provider>;
}
