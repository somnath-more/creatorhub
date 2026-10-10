import { PortalRoutes } from "../App";
import { AuthContext } from "../features/auth/authContext";
import { AuthClient } from "../features/auth/authClient";
const client = new AuthClient();
/** Existing demo UI regression tests bypass transport; auth flows have their own suite. */
export function AuthenticatedPortal() {
  return <AuthContext.Provider value={{ client, state: { status: "authenticated", session: {
    accessToken: "test-token", tokenType: "Bearer", expiresIn: 900,
    creator: { userId: "demo-test", creatorId: "demo-creator", fullName: "Demo Creator", email: "test@example.com", emailVerified: true },
  } } }}><PortalRoutes /></AuthContext.Provider>;
}
