import { ChartNoAxesCombined } from "lucide-react";
import { WorkspacePlaceholder } from "../components/organisms/WorkspacePlaceholder";

export function DashboardPage() {
  return (
    <WorkspacePlaceholder
      title="Dashboard"
      description="A clearer picture of your creative business."
      icon={ChartNoAxesCombined}
      heading="Your overview is taking shape"
      message="Revenue, purchases, and content performance will appear here when the dashboard is connected."
      action={{ to: "/content", label: "Explore your content" }}
    />
  );
}
