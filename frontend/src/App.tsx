import { Route, Routes } from "react-router-dom";
import { PortalLayout } from "./layouts/PortalLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { ContentPage } from "./pages/ContentPage";
import { CreateContentPage } from "./pages/CreateContentPage";
import { VerificationPage } from "./pages/VerificationPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { EditContentPage } from "./pages/EditContentPage";

export default function App() {
  return (
    <Routes>
      <Route element={<PortalLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="content" element={<ContentPage />} />
        <Route path="content/new" element={<CreateContentPage />} />
        <Route path="content/:id/edit" element={<EditContentPage />} />
        <Route path="verification" element={<VerificationPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
