import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  LifeBuoy,
  Lock,
  MapPin,
  MessageSquare,
  Navigation,
  PhoneCall,
  RotateCcw,
  ScanLine,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, BigButton, Pill, ScreenHeader } from "@/components/pulse/shell";
import { stopLabel, usePackages, useReattemptStop, useStops } from "@/lib/pulse-data";
import { useUnitPrefs } from "@/lib/units";


export const Route = createFileRoute("/stop/$seq")({
  head: () => ({
    meta: [
      { title: "Stop Details — PulseRoute" },
      {
        name: "description",
        content:
          "Recipient contact, gate codes, hazard warnings, drop instructions and the parcel manifest for the selected stop.",
      },
      { property: "og:title", content: "Stop Details — PulseRoute" },
      {
        property: "og:description",
        content: "Access instructions, hazards and parcel manifest for a PulseRoute delivery stop.",
      },
    ],
  }),
  component: StopDetail,
});

function StopDetail() {
  const fmt = useUnitPrefs();
  const { seq } = Route.useParams();
  const navigate = useNavigate();
  const { data: stops = [] } = useStops();
  const stop = stops.find((s) => String(s.seq) === seq);
  const { data: packages = [] } = usePackages(stop?.id);
  const reattempt = useReattemptStop();


  if (!stop) {
    return (
      <AppShell>
        <ScreenHeader title="Stop Details" subtitle="Loading stop…" />
      </AppShell>
    );
  }

  const allScanned = packages.length > 0 && packages.every((p) => p.scanned);

  return (
    <AppShell className="flex flex-col">
      <ScreenHeader
        title="Stop Details"
        left={
          <Link
            to="/manifest"
            aria-label="Back to manifest"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        }
        right={
          <Pill tone="warning">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
            {fmt.clockString(stop.window_start)} – {fmt.clockString(stop.window_end)}
          </Pill>
        }
      />

      <div className="space-y-3 px-4 py-4">
        <section className="rounded-2xl border border-border bg-surface p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <Pill>
              Stop {stopLabel(stop.seq)} of {stopLabel(stops.length)}
            </Pill>
            <span className="text-sm font-bold text-primary">{fmt.km(stop.distance_km)} away</span>
          </div>
          <h2 className="mt-3 truncate text-2xl font-bold">{stop.recipient}</h2>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {stop.address}, {stop.sector}
            </span>
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a
              href={`tel:${(stop.phone ?? "").replace(/\s/g, "")}`}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 text-sm font-bold"
            >
              <PhoneCall className="h-4 w-4" /> Call Recipient
            </a>
            <button
              onClick={() => toast.success(`ETA ${fmt.clockString(stop.eta)} sent to ${stop.recipient}`)}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 text-sm font-bold"
            >
              <MessageSquare className="h-4 w-4" /> Send ETA SMS
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-4">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-warning">
            <Lock className="h-4 w-4" /> Security &amp; Access Instructions
          </h3>
          {stop.gate_code ? (
            <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl bg-surface-2 px-4 py-3">
              <span className="truncate text-sm text-muted-foreground">Keypad Gate Code:</span>
              <span className="text-lg font-bold">{stop.gate_code}</span>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No gate code on file.</p>
          )}
          {stop.hazard_warning ? (
            <p className="mt-2 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm font-semibold text-destructive">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> Warning: {stop.hazard_warning}
            </p>
          ) : null}
          {stop.drop_instruction ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Drop Instruction: {stop.drop_instruction}
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <h3 className="truncate text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Parcel Manifest ({packages.length} items)
            </h3>
            <span className={`text-xs font-bold ${allScanned ? "text-success" : "text-warning"}`}>
              {allScanned ? "Loaded" : "Scan pending"}
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {packages.map((pkg) => (
              <li
                key={pkg.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl bg-surface-2 px-3 py-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">
                    PKG #{pkg.code} • {pkg.kind}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {pkg.description}
                  </span>
                </span>
                {pkg.scanned ? (
                  <Pill tone="success">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                  </Pill>
                ) : (
                  <Pill tone="warning">Unscanned</Pill>
                )}
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate({ to: "/scan/$seq", params: { seq } })}
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 text-sm font-bold"
          >
            <ScanLine className="h-4 w-4" /> Scan parcels for this stop
          </button>
        </section>
      </div>

      <div className="safe-bottom mt-auto space-y-2 border-t border-border/70 bg-background px-4 pt-3">
        {stop.status === "exception" ? (
          <BigButton
            tone="warning"
            disabled={reattempt.isPending}
            onClick={async () => {
              await reattempt.mutateAsync({
                stopId: stop.id,
                nextSeq: Math.max(...stops.map((s) => s.seq)) + 1,
              });
              toast.success(`${stop.recipient} moved to the end of the route for a retry`);
            }}
          >

            <RotateCcw className="h-5 w-5" /> Reattempt This Stop
          </BigButton>
        ) : null}
        <BigButton onClick={() => navigate({ to: "/nav/$seq", params: { seq } })}>
          <Navigation className="h-5 w-5" /> Launch Turn-by-Turn Navigation
        </BigButton>
        <Link
          to="/help/$seq"
          params={{ seq }}
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 text-sm font-bold"
        >
          <LifeBuoy className="h-4 w-4" /> Need help at this stop?
        </Link>
      </div>

    </AppShell>
  );
}
