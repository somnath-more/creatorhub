import { ShieldCheck } from "lucide-react";
import { WorkspacePlaceholder } from "../components/organisms/WorkspacePlaceholder";

export function VerificationPage() {
  return (
    <WorkspacePlaceholder
      title="Verification"
      description="Build trust and get ready to publish."
      icon={ShieldCheck}
      heading="Get ready for your first release"
      message="The identity verification flow will be available here. You can create drafts before verification; publishing requires a verified account."
    />
  );
}
