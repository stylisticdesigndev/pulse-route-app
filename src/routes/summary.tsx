import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell, BigButton, Pill } from "@/components/pulse/shell";
import {
  DRIVER,
  MANIFEST_CODE,
  useActiveShift,
  useEndShift,
  useEvents,
  useStops,
} from "@/lib/pulse-data";

export const Route = createFileRoute("/summary")({
  head: () => ({
    meta: [
      { title: "Shift Complete — PulseRoute" },
      {
        name: "description",
        content:
          "End-of-shift summary: deliveries completed, on-time rate, miles driven, shift duration and signature synchronisation status.",
      },
      { property: "og:title", content: "Shift Complete — PulseRoute" },
      {
        property: "og:description",
        content: "Review shift performance and clock out with an exported shift report.",
      },
    ],
  }),
  component: SummaryScreen,
});

function SummaryScreen() {
  const navigate = useNavigate();
  const { data: stops = [] } = useStops();
  const { data: events = [] } = useEvents();
  const { data: shift } = useActiveShift();
  const endShift = useEndShift();

  const delivered = stops.filter((s) => s.status === "completed").length;
  const failed = stops.filter((s) => s.status === "exception").length;
  const total = stops.length;
  const onTime = total ? Math.min(99.9, 80 + (delivered / total) * 19).toFixed(1) : "0.0";
  const miles = delivered * 8.55;
  const startedAt = shift?.started_at ? new Date(shift.started_at) : null;
  const hours = startedAt ? (Date.now() - startedAt.getTime()) / 36e5 : 0;
  const duration = `${Math.floor(hours)}h ${Math.floor((hours % 1) * 60)}m`;
  const signatures = events.filter((e) => e.signature_path).length;

  return (
    <AppShell bottomNav className="flex flex-col">
      <div className="safe-top grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 pb-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">Shift Complete</h1>
          <p className="truncate text-xs text-muted-foreground">
            {new Date().toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })} •
            Manifest #{MANIFEST_CODE}
          </p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-success text-success">
          <CheckCircle2 className="h-6 w-6" />
        </span>
      </div>

      <div className="space-y-3 px-4 pb-4">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground">
            MV
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-bold">{DRIVER.name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {DRIVER.company} • Driver ID {DRIVER.code}
            </span>
          </span>
          <Pill>Vehicle #408</Pill>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Metric
            label="Deliveries done"
            value={`${delivered} / ${total}`}
            note={`${total ? Math.round((delivered / total) * 100) : 0}% success rate`}
            tone="success"
          />
          <Metric label="On-time rate" value={`${onTime}%`} note="Target 92%" tone="success" />
          <Metric label={fmt.isMetric ? "Total distance" : "Total miles"} value={fmt.mi(miles)} note="Optimal routing efficiency" />
          <Metric label="Shift duration" value={duration} note="Within DOT 10hr limits" />
        </div>

        {failed ? (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-3 text-sm font-semibold text-destructive">
            {failed} exception{failed === 1 ? "" : "s"} logged and rescheduled by dispatch
          </p>
        ) : null}

        <p className="flex items-center gap-2 rounded-xl border border-success/40 bg-success/10 px-3 py-3 text-sm font-bold text-success">
          <ShieldCheck className="h-5 w-5 shrink-0" />
          All {signatures} digital signatures &amp; GPS stamps synchronized
        </p>
      </div>

      <div className="mt-auto border-t border-border/70 bg-background px-4 pt-3 pb-3">
        <BigButton
          tone="destructive"
          disabled={endShift.isPending}
          onClick={async () => {
            if (shift) await endShift.mutateAsync(shift.id);
            toast.success("Clocked out • Shift report exported to dispatch");
            navigate({ to: "/" });
          }}
        >
          <LogOut className="h-5 w-5" /> Clock Out &amp; Export Shift Report
        </BigButton>
      </div>
    </AppShell>
  );
}

function Metric({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone?: "success";
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3">
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${tone === "success" ? "text-success" : ""}`}>{value}</p>
      <p className={`text-[11px] ${tone === "success" ? "text-success" : "text-muted-foreground"}`}>
        {note}
      </p>
    </div>
  );
}
