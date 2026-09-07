import { createFileRoute } from "@tanstack/react-router";
import { Clock, Gauge, LineChart, TriangleAlert } from "lucide-react";
import { AppShell, Pill, ScreenHeader } from "@/components/pulse/shell";
import { EmptyState, ErrorState } from "@/components/pulse/states";
import { stopLabel, useEvents, useStops } from "@/lib/pulse-data";
import { useUnitPrefs } from "@/lib/units";

export const Route = createFileRoute("/performance")({
  head: () => ({
    meta: [
      { title: "Performance — PulseRoute" },
      {
        name: "description",
        content:
          "On-time rate, completion rate and a per-stop breakdown of every delivery window you hit or missed.",
      },
      { property: "og:title", content: "Performance — PulseRoute" },
      {
        property: "og:description",
        content: "Driver on-time and completion performance across the PulseRoute manifest.",
      },
    ],
  }),
  component: Performance,
});

function minutesOfDay(hhmm: string) {
  const match = /^(\d{1,2}):(\d{2})/.exec(hhmm.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function Performance() {
  const { data: stops = [], isLoading, isError, refetch, isFetching } = useStops();
  const { data: events = [] } = useEvents();
  const fmt = useUnitPrefs();

  const closed = stops.filter((s) => s.status === "completed" || s.status === "exception");
  const delivered = stops.filter((s) => s.status === "completed");
  const rows = delivered.map((stop) => {
    const event = events.find((e) => e.stop_id === stop.id);
    const at = event?.created_at ?? stop.completed_at;
    const end = minutesOfDay(stop.window_end);
    let onTime: boolean | null = null;
    if (at && end !== null) {
      const d = new Date(at);
      onTime = d.getHours() * 60 + d.getMinutes() <= end;
    }
    return { stop, at, onTime };
  });
  const rated = rows.filter((r) => r.onTime !== null);
  const onTimeRate = rated.length
    ? Math.round((rated.filter((r) => r.onTime).length / rated.length) * 100)
    : null;
  const completionRate = closed.length
    ? Math.round((delivered.length / closed.length) * 100)
    : null;

  return (
    <AppShell bottomNav>
      <ScreenHeader
        title="Performance"
        subtitle="Derived from your proof-of-service events"
        left={
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <LineChart className="h-5 w-5" />
          </span>
        }
        right={
          onTimeRate !== null ? (
            <Pill tone={onTimeRate >= 95 ? "success" : onTimeRate >= 85 ? "warning" : "destructive"}>
              {onTimeRate}% on time
            </Pill>
          ) : null
        }
      />
      <div className="space-y-3 px-4 py-4">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading performance…</p>
        ) : null}
        {isError ? <ErrorState onRetry={() => refetch()} retrying={isFetching} /> : null}

        {!isLoading && !isError && closed.length === 0 ? (
          <EmptyState
            icon={Gauge}
            title="No performance data yet"
            body="Clear your first stop and your on-time and completion rates appear here."
          />
        ) : null}

        {closed.length ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-border bg-surface p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  On-time rate
                </p>
                <p className="mt-1 text-3xl font-bold text-success">
                  {onTimeRate !== null ? `${onTimeRate}%` : "—"}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {rated.length} rated stop{rated.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Completion rate
                </p>
                <p className="mt-1 text-3xl font-bold text-primary">
                  {completionRate !== null ? `${completionRate}%` : "—"}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {delivered.length} of {closed.length} closed
                </p>
              </div>
            </div>

            <p className="px-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Per-stop breakdown
            </p>
            <ul className="space-y-2">
              {rows.map(({ stop, at, onTime }) => (
                <li
                  key={stop.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-xs font-black text-muted-foreground">
                    {stopLabel(stop.seq)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{stop.recipient}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      Window {fmt.clockString(stop.window_start)}–{fmt.clockString(stop.window_end)} • closed{" "}
                      {fmt.time(at)}
                    </span>
                  </span>
                  <Pill tone={onTime === null ? "muted" : onTime ? "success" : "warning"}>
                    <Clock className="h-3.5 w-3.5" />
                    {onTime === null ? "Unrated" : onTime ? "On time" : "Late"}
                  </Pill>
                </li>
              ))}
              {stops
                .filter((s) => s.status === "exception")
                .map((stop) => (
                  <li
                    key={stop.id}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/20 text-destructive">
                      <TriangleAlert className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{stop.recipient}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        Not completed — logged as an exception
                      </span>
                    </span>
                    <Pill tone="destructive">Missed</Pill>
                  </li>
                ))}
            </ul>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
