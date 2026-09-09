import { BatteryFull, BatteryLow, BatteryMedium, ChevronRight, Radio, Signal, Truck } from "lucide-react";
import { toast } from "sonner";
import { AppShell, BigButton, Pill, ScreenHeader } from "@/components/pulse/shell";
import { MapCanvas } from "@/components/pulse/map-canvas";
import { stopLabel, useStops } from "@/lib/pulse-data";
import { cn } from "@/lib/utils";
import { useUnitPrefs } from "@/lib/units";
import { useGhost } from "@/lib/ghost-demo";
import { demoHasPriorityStop } from "@/lib/demo-manifest";
import { AlertTriangle, ArrowRightLeft, Leaf, TrendingUp, X } from "lucide-react";
import { useEffect, useState } from "react";

/** Counts a value up naturally once mounted, for the dispatch analytics panel. */
function useCountUp(target: number, ms = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

const MARKERS = [
  { id: "408", left: "34%", top: "62%" },
  { id: "212", left: "66%", top: "22%" },
  { id: "119", left: "22%", top: "28%" },
  { id: "377", left: "72%", top: "70%" },
  { id: "590", left: "50%", top: "44%" },
];

const UNASSIGNED = [
  { code: "RT-8851", stops: 14, sector: "Riverside North", window: "13:00 – 17:30" },
  { code: "RT-8852", stops: 9, sector: "Harbor District", window: "14:00 – 18:00" },
  { code: "RT-8853", stops: 17, sector: "Midtown Loop", window: "15:00 – 20:00" },
];

const TELEMETRY = [
  { name: "Marcus Vance", van: "Van #408", stop: "Stop 4 — Riverside Ct", battery: 78, ping: "12s ago" },
  { name: "Dana Whitfield", van: "Van #212", stop: "Stop 9 — Grant Plaza", battery: 41, ping: "48s ago" },
  { name: "Terrence Ojo", van: "Van #119", stop: "Stop 2 — Cedar Mill", battery: 17, ping: "3m ago" },
  { name: "Priya Raman", van: "Van #377", stop: "Stop 11 — Dockside", battery: 64, ping: "22s ago" },
  { name: "Luis Ferrer", van: "Van #590", stop: "Depot — loading", battery: 93, ping: "8s ago" },
];

function batteryIcon(level: number) {
  if (level <= 20) return BatteryLow;
  if (level <= 60) return BatteryMedium;
  return BatteryFull;
}

/** Dispatch supervisor fleet dashboard shown when the developer role is switched. */
export function FleetOverview() {
  const fmt = useUnitPrefs();
  const { phase } = useGhost();
  const stepId = phase === "idle" || phase === "courier" ? undefined : phase;
  const [drawer, setDrawer] = useState<string | null>(null);
  const { data: stops = [] } = useStops();
  const activeStop =
    stops.find((s) => s.status === "in_transit") ?? stops.find((s) => s.status === "pending");

  return (
    <AppShell bottomNav>
      <ScreenHeader title="Fleet Overview" subtitle="Apex Move Dynamics • Dispatch console" />

      <div className="space-y-3 px-4 py-4">
        {stepId === "anomaly" ? (
          <section className="rounded-2xl border border-destructive/50 bg-destructive/10 p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-destructive">
                Priority alert — Route 4
              </h2>
            </div>
            <p className="mt-2 text-sm font-bold">Delivery delayed 18 min • geofence breach</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Van #212 (Dana Whitfield) also raised a maintenance flag — brake wear sensor.
            </p>
            <div className="mt-3 flex gap-2">
              <Pill tone="destructive">Critical</Pill>
              <Pill tone="warning">Maintenance</Pill>
            </div>
          </section>
        ) : null}

        {stepId === "reassign" ? (
          <section className="rounded-2xl border border-primary/50 bg-primary/10 p-4">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-primary">
                Route reassignment
              </h2>
            </div>
            <p className="mt-2 text-sm font-bold">APX-9001 • Priority medical carton</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Moved from Route 4 (Van #212, delayed) to Marcus Vance — Van #408.
              {demoHasPriorityStop() ? " Applied optimistically; courier notified." : ""}
            </p>
          </section>
        ) : null}

        {stepId === "telemetry" ? <TelemetryPanel /> : null}

        <div className="grid grid-cols-3 gap-2">
          <Metric label="Active drivers" value="8/10" tone="text-success" />
          <Metric label="Stops cleared" value="142/180" tone="text-foreground" />
          <Metric label="Exceptions" value="2" tone="text-destructive" />
        </div>

        <section className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="relative h-[240px]">
            <MapCanvas variant="overview" />
            {MARKERS.map((m) => (
              <button
                key={m.id}
                onClick={() => setDrawer(m.id)}
                aria-label={`Van #${m.id} telemetry`}
                className={cn(
                  "absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black shadow-lg transition-transform",
                  drawer === m.id
                    ? "scale-125 border-primary bg-primary text-primary-foreground"
                    : "border-warning/60 bg-warning text-warning-foreground",
                )}
                style={{ left: m.left, top: m.top }}
              >
                <Truck className="h-3 w-3" strokeWidth={2.6} /> {m.id}
              </button>
            ))}
            <div className="absolute left-3 top-3">
              <Pill tone="warning">
                <Signal className="h-3.5 w-3.5" /> 5 vans live
              </Pill>
            </div>
          </div>

          {drawer ? (
            <div className="border-t border-border bg-surface-2 px-4 py-3">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">Van #{drawer}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {TELEMETRY.find((t) => t.van.endsWith(drawer))?.name ?? "Unassigned"} •{" "}
                    {TELEMETRY.find((t) => t.van.endsWith(drawer))?.stop ?? "Depot"}
                  </p>
                </div>
                <button
                  onClick={() => setDrawer(null)}
                  aria-label="Close vehicle drawer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-surface"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <BigButton
                className="mt-3 h-12"
                onClick={() => toast.success("APX-9001 moved to Van #408 — Marcus Vance")}
              >
                <ArrowRightLeft className="h-4 w-4" /> Reassign APX-9001 to Van #408
              </BigButton>
            </div>
          ) : null}
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border px-4 py-3">
            <p className="min-w-0 truncate text-xs text-muted-foreground">
              Van #408 — Marcus Vance{" "}
              {activeStop ? `• en route to ${stopLabel(activeStop.seq)} ${activeStop.recipient}` : ""}
            </p>
            <Pill tone="success">On time</Pill>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <h2 className="truncate text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Unassigned routes
            </h2>
            <Pill tone="warning">{UNASSIGNED.length} open</Pill>
          </div>
          <ul className="mt-3 space-y-2">
            {UNASSIGNED.map((r) => (
              <li key={r.code} className="rounded-xl border border-border bg-surface-2 p-3">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {r.code} • {r.sector}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.stops} stops • {r.window.split(" – ").map((t) => fmt.clockString(t)).join(" – ")}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                <BigButton
                  className="mt-3 h-12"
                  onClick={() => toast.success(`${r.code} queued for driver assignment`)}
                >
                  Assign to Driver
                </BigButton>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Driver telemetry
          </h2>
          <ul className="mt-3 space-y-2">
            {TELEMETRY.map((d) => {
              const Battery = batteryIcon(d.battery);
              return (
                <li
                  key={d.van}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-surface-2 px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {d.name} <span className="text-muted-foreground">• {d.van}</span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{d.stop}</p>
                    <p className="mt-1 flex items-center gap-1 truncate text-[11px] font-semibold text-muted-foreground">
                      <Radio className="h-3 w-3" /> GPS ping {d.ping}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex items-center gap-1 text-xs font-bold",
                      d.battery <= 20
                        ? "text-destructive"
                        : d.battery <= 60
                          ? "text-warning"
                          : "text-success",
                    )}
                  >
                    <Battery className="h-4 w-4" /> {d.battery}%
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <p className="truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-1 text-xl font-bold", tone)}>{value}</p>
    </div>
  );
}
