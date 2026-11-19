import { Compass } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonClass, EmptyState } from "../components/ui";

export function NotFoundPage() {
  return (
    <EmptyState
      icon={Compass}
      title="Page not found"
      description="That route does not exist in this workspace."
      action={
        <Link to="/" className={buttonClass("primary")}>
          Back to communities
        </Link>
      }
    />
  );
}
