import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, ChevronRight, History as HistoryIcon } from "lucide-react";
import { AppShell, Pill, ScreenHeader } from "@/components/pulse/shell";
import { EmptyState, ErrorState } from "@/components/pulse/states";
import { useShiftHistory } from "@/lib/pulse-data";
import { useUnitPrefs } from "@/lib/units";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Shift History — PulseRoute" },
      {
        name: "description",
        content:
          "Every past shift with stops cleared, exceptions, distance and duration — tap one to reopen its summary.",
      },
      { property: "og:title", content: "Shift History — PulseRoute" },
      {
        property: "og:description",
        content: "Review previous PulseRoute shifts and their delivery outcomes.",
      },
    ],
  }),
  component: HistoryScreen,
});

export function shiftDuration(startedAt: string, endedAt: string | null) {
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const mins = Math.max(0, Math.round((end - new Date(startedAt).getTime()) / 60000));
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m`;
}

function HistoryScreen() {
  const fmt = useUnitPrefs();
  const { data: shifts = [], isLoading, isError, refetch, isFetching } = useShiftHistory();

  return (
    <AppShell bottomNav>
      <ScreenHeader
        title="Shift History"
        subtitle="Completed and active shifts on van #408"
        left={
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <HistoryIcon className="h-5 w-5" />
          </span>
        }
      />
      <div className="space-y-2 px-4 py-4">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading history…</p>
        ) : null}

        {isError ? (
          <ErrorState onRetry={() => refetch()} retrying={isFetching} />
        ) : null}

        {!isLoading && !isError && shifts.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No shifts yet"
            body="Once you clock out, each shift shows up here with its stops and exceptions."
          />
        ) : null}

        {shifts.map((shift) => (
          <Link
            key={shift.id}
            to="/history/$id"
            params={{ id: shift.id }}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">
                {new Date(shift.started_at).toLocaleDateString([], {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}{" "}
                • #{shift.manifest_code}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {fmt.time(shift.started_at)}{" "}
                • {shiftDuration(shift.started_at, shift.ended_at)} • {shift.vehicle}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <Pill tone={shift.status === "completed" ? "success" : shift.status === "paused" ? "warning" : "primary"}>
                {shift.status === "completed" ? "Closed" : shift.status === "paused" ? "On break" : "Active"}
              </Pill>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
