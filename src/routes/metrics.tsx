import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, CloudOff, LineChart, TrendingUp } from "lucide-react";
import { AppShell, BigButton, Pill, ScreenHeader } from "@/components/pulse/shell";
import { EmptyState, ErrorState, OffShiftState } from "@/components/pulse/states";
import { stopLabel, useActiveShift, useEvents, useQueue, useStops } from "@/lib/pulse-data";
import { useUnitPrefs } from "@/lib/units";


export const Route = createFileRoute("/metrics")({
  head: () => ({
    meta: [
      { title: "Shift Metrics — PulseRoute" },
      {
        name: "description",
        content:
          "Live shift performance: stops cleared, exceptions, queued syncs and a timeline of every proof-of-service event.",
      },
      { property: "og:title", content: "Shift Metrics — PulseRoute" },
      {
        property: "og:description",
        content: "Live delivery performance and event timeline for the current PulseRoute shift.",
      },
    ],
  }),
  component: Metrics,
});

function Metrics() {
  const fmt = useUnitPrefs();
  const { data: stops = [] } = useStops();
  const { data: events = [], isLoading, isError, refetch, isFetching } = useEvents();
  const { data: shift, isLoading: shiftLoading } = useActiveShift();
  const queue = useQueue();
  const delivered = stops.filter((s) => s.status === "completed").length;
  const exceptions = stops.filter((s) => s.status === "exception").length;

  if (!shiftLoading && !shift) {
    return (
      <AppShell bottomNav>
        <OffShiftState />
      </AppShell>
    );
  }

  return (
    <AppShell bottomNav>
      <ScreenHeader
        title="Shift Metrics"
        subtitle="Live performance for manifest #RT-8842"
        right={<Pill tone="primary">
          <TrendingUp className="h-3.5 w-3.5" /> Live
        </Pill>}
      />
      <div className="space-y-3 px-4 py-4">
        <div className="grid grid-cols-3 gap-2">
          <Tile label="Cleared" value={`${delivered}/${stops.length}`} tone="success" />
          <Tile label="Exceptions" value={String(exceptions)} tone={exceptions ? "destructive" : "muted"} />
          <Tile label="Queued" value={String(queue.length)} tone={queue.length ? "warning" : "muted"} />
        </div>

        {queue.length ? (
          <Link
            to="/offline"
            className="flex items-center gap-2 rounded-xl border border-warning/40 bg-warning/10 px-3 py-3 text-sm font-bold text-warning"
          >
            <CloudOff className="h-4 w-4" /> {queue.length} drop-off(s) waiting to sync
          </Link>
        ) : null}

        {isError ? (
          <ErrorState
            title="Metrics didn't load"
            body="The event timeline is temporarily unreachable."
            onRetry={() => refetch()}
            retrying={isFetching}
          />
        ) : null}

        <p className="px-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Event timeline
        </p>

        {!isLoading && !isError && events.length === 0 ? (
          <EmptyState
            icon={LineChart}
            title="No activity yet this shift"
            body="Clear your first stop and every proof of service lands on this timeline."
            action={
              <Link to="/manifest">
                <BigButton tone="ghost">Go to manifest</BigButton>
              </Link>
            }
          />
        ) : null}

        <ul className="space-y-2">

          {events.map((event) => {
            const stop = stops.find((s) => s.id === event.stop_id);
            const failed = event.event_type === "exception";
            return (
              <li
                key={event.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${failed ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}`}
                >
                  <Activity className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">
                    Stop {stop ? stopLabel(stop.seq) : "--"} • {stop?.recipient ?? "Unknown"}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {failed ? event.reason : "Proof of service captured"} •{" "}
                    {fmt.time(event.created_at)}
                  </span>
                </span>
                <Pill tone={failed ? "destructive" : "success"}>{failed ? "Exception" : "Synced"}</Pill>
              </li>
            );
          })}
        </ul>
      </div>
    </AppShell>
  );
}

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "destructive" | "muted";
}) {
  const tones = {
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
    muted: "text-foreground",
  } as const;
  return (
    <div className="rounded-2xl border border-border bg-surface p-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 text-xl font-bold ${tones[tone]}`}>{value}</p>
    </div>
  );
}
