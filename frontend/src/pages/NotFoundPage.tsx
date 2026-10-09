import { Compass } from "lucide-react";
import { WorkspacePlaceholder } from "../components/organisms/WorkspacePlaceholder";

export function NotFoundPage() {
  return (
    <WorkspacePlaceholder
      title="Page not found"
      description="This page may have moved, or the address may be incorrect."
      icon={Compass}
      heading="Let's get you back on track"
      message="Your creator workspace is just a click away."
      action={{ to: "/", label: "Back to dashboard" }}
    />
  );
}
