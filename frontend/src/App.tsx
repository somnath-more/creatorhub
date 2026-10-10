import { Navigate, Route, Routes } from "react-router-dom";
import { demoMode } from './demo/demoMode';
import { DemoProvider } from './demo/DemoProvider';
import { RecoveryPage } from "./features/auth/RecoveryPage";
import { PortalLayout } from "./layouts/PortalLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { ContentPage } from "./pages/ContentPage";
import { CreateContentPage } from "./pages/CreateContentPage";
import { VerificationPage } from "./pages/VerificationPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { EditContentPage } from "./pages/EditContentPage";
import { ContentDetail } from "./features/content/ContentDetail";
import { AuthProvider } from "./features/auth/AuthProvider";
import { ProtectedRoute } from "./features/auth/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

export default function App() {
  if (demoMode) return <DemoProvider><PortalRoutes /></DemoProvider>;
  return <AuthProvider><PortalRoutes /></AuthProvider>;
}

export function PortalRoutes() {
  return (
    <Routes>
      <Route path="forgot-password" element={demoMode ? <Navigate to="/" replace /> : <RecoveryPage key="forgot" mode="forgot-password" />} />
      <Route path="reset-password" element={demoMode ? <Navigate to="/" replace /> : <RecoveryPage key="reset" mode="reset-password" />} />
      <Route path="verify-email" element={demoMode ? <Navigate to="/" replace /> : <RecoveryPage key="verify" mode="verify-email" />} />
      <Route path="login" element={demoMode ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="register" element={demoMode ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route element={<ProtectedRoute />}>
      <Route element={<PortalLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="content" element={<ContentPage />} />
        <Route path="content/new" element={<CreateContentPage />} />
        <Route path="content/:id/edit" element={<EditContentPage />} />
        <Route path="content/:id" element={<ContentDetail />} />
        <Route path="verification" element={<VerificationPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      </Route>
    </Routes>
  );
}
