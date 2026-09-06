import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Gauge, MapPin, TriangleAlert } from "lucide-react";
import { AppShell, Pill, ScreenHeader } from "@/components/pulse/shell";
import { ErrorState } from "@/components/pulse/states";
import { stopLabel, useEvents, useShift, useStops } from "@/lib/pulse-data";
import { shiftDuration } from "./history";

export const Route = createFileRoute("/history_/$id")({
  head: () => ({
    meta: [
      { title: "Shift Detail — PulseRoute" },
      {
        name: "description",
        content:
          "Full record of a past PulseRoute shift: odometer, duration, stops cleared and every proof-of-service event.",
      },
      { property: "og:title", content: "Shift Detail — PulseRoute" },
      {
        property: "og:description",
        content: "Reopen the summary for a completed PulseRoute shift.",
      },
    ],
  }),
  component: ShiftDetail,
});

function ShiftDetail() {
  const { id } = useParams({ from: "/history_/$id" });
  const { data: shift, isLoading, isError, refetch, isFetching } = useShift(id);
  const { data: events = [] } = useEvents();
  const { data: stops = [] } = useStops();

  const shiftEvents = events.filter((e) => e.shift_id === id);
  const delivered = shiftEvents.filter((e) => e.event_type === "delivered").length;
  const exceptions = shiftEvents.filter((e) => e.event_type === "exception").length;
  const miles =
    shift?.odometer_end && shift?.odometer_start
      ? Number(shift.odometer_end) - Number(shift.odometer_start)
      : null;

  return (
    <AppShell bottomNav>
      <ScreenHeader
        title="Shift detail"
        subtitle={shift ? `#${shift.manifest_code} • ${shift.vehicle}` : "Loading…"}
        left={
          <Link
            to="/history"
            aria-label="Back to history"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        }
        right={
          shift ? (
            <Pill tone={shift.status === "completed" ? "success" : "primary"}>
              {shift.status === "completed" ? "Closed" : "Active"}
            </Pill>
          ) : null
        }
      />
      <div className="space-y-3 px-4 py-4">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading shift…</p>
        ) : null}
        {isError ? <ErrorState onRetry={() => refetch()} retrying={isFetching} /> : null}

        {shift ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              <Tile label="Delivered" value={String(delivered)} tone="text-success" />
              <Tile label="Exceptions" value={String(exceptions)} tone={exceptions ? "text-destructive" : "text-foreground"} />
              <Tile
                label="Duration"
                value={shiftDuration(shift.started_at, shift.ended_at)}
                tone="text-foreground"
              />
            </div>

            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2">
                <Gauge className="h-5 w-5 text-muted-foreground" />
              </span>
              <span className="truncate text-sm text-muted-foreground">Distance driven</span>
              <span className="truncate text-sm font-bold">
                {miles !== null ? `${miles.toFixed(1)} mi` : "In progress"}
              </span>
            </div>

            <p className="px-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Events ({shiftEvents.length})
            </p>
            {shiftEvents.length === 0 ? (
              <p className="rounded-xl border border-border bg-surface px-4 py-6 text-center text-sm text-muted-foreground">
                No proof-of-service events recorded on this shift.
              </p>
            ) : null}
            <ul className="space-y-2">
              {shiftEvents.map((event) => {
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
                      {failed ? <TriangleAlert className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">
                        Stop {stop ? stopLabel(stop.seq) : "--"} • {stop?.recipient ?? "Unknown"}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {failed ? event.reason : "Proof of service captured"} • attempt {event.attempt}
                      </span>
                    </span>
                    <Pill tone={failed ? "destructive" : "success"}>
                      {new Date(event.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Pill>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 text-xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}
