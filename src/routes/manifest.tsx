import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, CloudOff, Navigation } from "lucide-react";
import { AppShell, BigButton, Pill } from "@/components/pulse/shell";
import { MapCanvas } from "@/components/pulse/map-canvas";
import {
  stopLabel,
  useOfflineMode,
  useQueue,
  useStops,
  type Stop,
} from "@/lib/pulse-data";

export const Route = createFileRoute("/manifest")({
  head: () => ({
    meta: [
      { title: "Active Manifest — PulseRoute" },
      {
        name: "description",
        content:
          "Live delivery manifest with the active stop, ETA, remaining distance and one-tap turn-by-turn navigation.",
      },
      { property: "og:title", content: "Active Manifest — PulseRoute" },
      {
        property: "og:description",
        content: "Track the active stop, ETA and upcoming drop-offs on the PulseRoute driver manifest.",
      },
    ],
  }),
  component: ManifestScreen,
});

function ManifestScreen() {
  const navigate = useNavigate();
  const { data: stops = [], isLoading } = useStops();
  const offline = useOfflineMode();
  const queue = useQueue();

  const active =
    stops.find((s) => s.status === "in_transit") ?? stops.find((s) => s.status === "pending");
  const upcoming = stops.filter((s) => s.status === "pending" && s.id !== active?.id);
  const done = stops.filter((s) => s.status === "completed" || s.status === "exception");

  return (
    <AppShell bottomNav className="flex flex-col">
      <div className="relative h-[46vh] min-h-[240px] shrink-0">
        <MapCanvas variant="overview" stopLabel={active ? stopLabel(active.seq) : undefined} />
        {offline ? (
          <Link
            to="/offline"
            className="safe-top absolute inset-x-0 top-0 mx-3 flex items-center gap-2 rounded-xl border border-warning/50 bg-card/95 px-3 py-2 text-xs font-bold text-warning backdrop-blur"
          >
            <CloudOff className="h-4 w-4" /> Offline mode • {queue.length} queued locally
          </Link>
        ) : null}
      </div>

      <div className="-mt-6 flex-1 rounded-t-3xl border-t border-border bg-background px-3 pt-2 pb-4">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />

        {isLoading ? (
          <p className="px-2 py-8 text-center text-sm text-muted-foreground">Loading manifest…</p>
        ) : null}

        {active ? (
          <section className="rounded-2xl border border-border bg-surface p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Pill>Stop {stopLabel(active.seq)}</Pill>
                <Pill tone="warning">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                  {active.status === "in_transit" ? "In transit" : "Next up"}
                </Pill>
              </div>
              <span className="text-xs font-bold text-warning">ETA {active.eta}</span>
            </div>
            <h2 className="mt-2 truncate text-xl font-bold">{active.recipient}</h2>
            <p className="text-sm text-muted-foreground">
              {active.address} • {active.sector}
            </p>
            <p className="text-sm text-muted-foreground">
              Window: {active.window_start} – {active.window_end} • {active.distance_km} km remaining
            </p>
            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <BigButton onClick={() => navigate({ to: "/nav/$seq", params: { seq: String(active.seq) } })}>
                <Navigation className="h-5 w-5" /> Start Navigation
              </BigButton>
              <Link
                to="/stop/$seq"
                params={{ seq: String(active.seq) }}
                aria-label="Stop details"
                className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-surface-2"
              >
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </section>
        ) : null}

        <div className="mt-3 space-y-2">
          {upcoming.map((stop) => (
            <StopRow key={stop.id} stop={stop} />
          ))}
        </div>

        {done.length ? (
          <>
            <p className="mt-5 px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Completed ({done.length})
            </p>
            <div className="mt-2 space-y-2">
              {done.map((stop) => (
                <StopRow key={stop.id} stop={stop} />
              ))}
            </div>
          </>
        ) : null}

        {!upcoming.length && !active ? (
          <div className="mt-4 rounded-2xl border border-success/40 bg-success/10 p-4 text-center">
            <p className="font-bold text-success">All stops cleared</p>
            <Link to="/summary" className="mt-1 block text-sm text-muted-foreground underline">
              Review shift summary
            </Link>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

function StopRow({ stop }: { stop: Stop }) {
  const done = stop.status === "completed";
  const failed = stop.status === "exception";
  return (
    <Link
      to="/stop/$seq"
      params={{ seq: String(stop.seq) }}
      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3"
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
          done
            ? "bg-success/15 text-success"
            : failed
              ? "bg-destructive/15 text-destructive"
              : "bg-surface-2 text-muted-foreground"
        }`}
      >
        {stopLabel(stop.seq)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold">{stop.recipient}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {stop.address} • {stop.distance_km} km
        </span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}
