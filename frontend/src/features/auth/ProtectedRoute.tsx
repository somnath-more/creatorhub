import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Button } from "../../components/atoms/Button";
import { useAuth } from "./authContext";
export function ProtectedRoute() {
  const { state, client } = useAuth();
  const location = useLocation();
  if (state.status === "initializing") return <main className="p-8" role="status">Restoring your session…</main>;
  if (state.status === "error") return <main className="mx-auto max-w-lg p-8"><h1 className="text-2xl font-bold">Connection unavailable</h1><p role="alert" className="my-4">{state.error}</p><Button onClick={() => void client.bootstrap()}>Retry connection</Button></main>;
  if (!state.session) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet key={state.session.creator.userId} />;
}
