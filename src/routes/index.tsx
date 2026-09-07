import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Gauge, Navigation, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, BigButton, Pill } from "@/components/pulse/shell";
import { DRIVER, useStartShift } from "@/lib/pulse-data";
import { useUnitPrefs } from "@/lib/units";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PulseRoute — Driver Shift Start | Apex Move Dynamics" },
      {
        name: "description",
        content:
          "Start your PulseRoute shift: confirm your assigned van, log the odometer and clear the pre-trip safety checklist before loading the manifest.",
      },
      { property: "og:title", content: "PulseRoute — Driver Shift Start" },
      {
        property: "og:description",
        content: "Apex Move Dynamics fleet gateway for drivers: pre-trip checks, manifest and proof of delivery.",
      },
    ],
  }),
  component: DriverAuth,
});

const CHECKS = [
  "Tires & Pressure (PSI)",
  "Mirrors & Visibility",
  "Fuel Level (>75%)",
  "Brakes & Fluid Check",
  "Cargo Secured & Latched",
  "Mobile Device Mount",
];

function DriverAuth() {
  const fmt = useUnitPrefs();
  const navigate = useNavigate();
  const [odometer, setOdometer] = useState("42,890.4");
  const [checked, setChecked] = useState<boolean[]>(() => CHECKS.map(() => true));
  const startShift = useStartShift();
  const verified = checked.filter(Boolean).length;
  const ready = verified === CHECKS.length;

  async function start() {
    try {
      await startShift.mutateAsync(Number(odometer.replace(/,/g, "")) || 0);
      toast.success("Shift started — manifest loaded");
      navigate({ to: "/manifest" });
    } catch {
      toast.error("Could not start the shift. Try again.");
    }
  }

  return (
    <AppShell className="flex flex-col">
      <div className="safe-top px-4 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-[0_10px_30px_-10px_var(--primary)]">
            <Navigation className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">PulseRoute</h1>
            <p className="truncate text-sm text-muted-foreground">
              Apex Move Dynamics Fleet Gateway
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-4 pb-6">
        <section className="rounded-2xl border border-border bg-surface p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="flex min-w-0 items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <Truck className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">Assigned Asset</span>
            </div>
            <Pill tone="success">Ready</Pill>
          </div>
          <p className="mt-2 text-xl font-bold">{DRIVER.vehicle}</p>
          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Current Odometer ({fmt.isMetric ? "kilometres" : "miles"})
          </p>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3">
            <input
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
              inputMode="decimal"
              aria-label="Current odometer"
              className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none"
            />
            <Gauge className="h-5 w-5 shrink-0 text-muted-foreground" />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <h2 className="truncate text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Pre-Trip Safety Checklist
            </h2>
            <span
              className={`text-xs font-bold ${ready ? "text-success" : "text-warning"}`}
            >
              {verified} of {CHECKS.length} verified
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {CHECKS.map((label, i) => (
              <li key={label}>
                <button
                  onClick={() => setChecked((c) => c.map((v, idx) => (idx === i ? !v : v)))}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3 text-left"
                >
                  <span className="truncate text-sm font-medium">
                    {i + 1}. {label}
                  </span>
                  <CheckCircle2
                    className={`h-5 w-5 shrink-0 ${checked[i] ? "text-success" : "text-muted-foreground/40"}`}
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="safe-bottom mt-auto border-t border-border/70 bg-background px-4 pt-3">
        <BigButton onClick={start} disabled={!ready || startShift.isPending}>
          <ArrowRight className="h-5 w-5" /> Start Shift &amp; Load Manifest
        </BigButton>
      </div>
    </AppShell>
  );
}
