import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Bell, CheckCheck, CloudSun, Route as RouteIcon } from "lucide-react";
import { useEffect } from "react";
import { AppShell, Pill, ScreenHeader } from "@/components/pulse/shell";
import { EmptyState, ErrorState } from "@/components/pulse/states";
import { useMarkMessagesRead, useMessages } from "@/lib/pulse-data";
import { useUnitPrefs } from "@/lib/units";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Dispatch Messages — PulseRoute" },
      {
        name: "description",
        content:
          "Reroute notices, manifest updates and weather advisories sent from Apex Move Dynamics dispatch.",
      },
      { property: "og:title", content: "Dispatch Messages — PulseRoute" },
      {
        property: "og:description",
        content: "Every dispatch alert for the current PulseRoute shift in one feed.",
      },
    ],
  }),
  component: Notifications,
});

const ICONS = {
  reroute: RouteIcon,
  alert: AlertTriangle,
  info: Bell,
  weather: CloudSun,
} as const;

function Notifications() {
  const fmt = useUnitPrefs();
  const { data: messages = [], isLoading, isError, refetch, isFetching } = useMessages();
  const markRead = useMarkMessagesRead();
  const unread = messages.filter((m) => !m.read).length;

  useEffect(() => {
    if (unread > 0 && !markRead.isPending) markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unread]);

  return (
    <AppShell bottomNav>
      <ScreenHeader
        title="Dispatch"
        subtitle="Messages for manifest #RT-8842"
        left={
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Bell className="h-5 w-5" />
          </span>
        }
        right={
          unread ? (
            <Pill tone="warning">{unread} new</Pill>
          ) : (
            <Pill tone="success">
              <CheckCheck className="h-3.5 w-3.5" /> All read
            </Pill>
          )
        }
      />
      <div className="space-y-2 px-4 py-4">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading messages…</p>
        ) : null}

        {isError ? (
          <ErrorState
            title="Messages didn't load"
            body="Dispatch is unreachable right now."
            onRetry={() => refetch()}
            retrying={isFetching}
          />
        ) : null}

        {!isLoading && !isError && messages.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No messages"
            body="Dispatch hasn't sent anything for this shift. Alerts land here instantly."
          />
        ) : null}

        {messages.map((msg) => {
          const Icon = ICONS[(msg.kind as keyof typeof ICONS) ?? "info"] ?? Bell;
          const tone =
            msg.kind === "alert" ? "warning" : msg.kind === "reroute" ? "primary" : "muted";
          return (
            <article
              key={msg.id}
              className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-xl border border-border bg-surface px-3 py-3"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  tone === "warning"
                    ? "bg-warning/15 text-warning"
                    : tone === "primary"
                      ? "bg-primary/15 text-primary"
                      : "bg-surface-2 text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <h2 className="truncate text-sm font-bold">{msg.title}</h2>
                  <span className="text-[11px] text-muted-foreground">
                    {fmt.time(msg.created_at)}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{msg.body}</p>
              </div>
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
