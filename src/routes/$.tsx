import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { AppShell, BigButton } from "@/components/pulse/shell";
import { EmptyState } from "@/components/pulse/states";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: "Screen not found — PulseRoute" },
      {
        name: "description",
        content: "That PulseRoute screen doesn't exist. Head back to your active manifest.",
      },
      { property: "og:title", content: "Screen not found — PulseRoute" },
      {
        property: "og:description",
        content: "This PulseRoute address isn't part of the driver app.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotFoundScreen,
});

function NotFoundScreen() {
  return (
    <AppShell bottomNav>
      <div className="px-4 pt-10">
        <EmptyState
          icon={Compass}
          tone="primary"
          title="Off route"
          body="This screen isn't part of PulseRoute. Your shift data is untouched."
          action={
            <Link to="/manifest">
              <BigButton>Back to manifest</BigButton>
            </Link>
          }
        />
      </div>
    </AppShell>
  );
}
