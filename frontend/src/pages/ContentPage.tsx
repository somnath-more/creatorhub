import { ListVideo } from "lucide-react";
import { WorkspacePlaceholder } from "../components/organisms/WorkspacePlaceholder";

export function ContentPage() {
  return (
    <WorkspacePlaceholder
      title="Content"
      description="One place for everything you create."
      icon={ListVideo}
      heading="Make room for your next idea"
      message="Your content library and publishing tools will be available here in an upcoming update."
      action={{ to: "/content/new", label: "Create content" }}
    />
  );
}
