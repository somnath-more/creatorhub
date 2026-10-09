import { Video } from "lucide-react";
import { WorkspacePlaceholder } from "../components/organisms/WorkspacePlaceholder";

export function CreateContentPage() {
  return (
    <WorkspacePlaceholder
      title="Create content"
      description="Turn your next idea into something worth sharing."
      icon={Video}
      heading="Your creation space"
      message="The video upload and draft editor are coming next. You will be able to save your work before publishing."
    />
  );
}
