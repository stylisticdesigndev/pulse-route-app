import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Coffee, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell, BigButton, Pill, ScreenHeader } from "@/components/pulse/shell";
import { OffShiftState } from "@/components/pulse/states";
import { useActiveShift, useSetBreak } from "@/lib/pulse-data";

export const Route = createFileRoute("/break")({
  head: () => ({
    meta: [
      { title: "Break & Availability — PulseRoute" },
      {
        name: "description",
        content:
          "Pause your shift for a break: dispatch holds new stops, the break timer runs and you resume in one tap.",
      },
      { property: "og:title", content: "Break & Availability — PulseRoute" },
      {
        property: "og:description",
        content: "Go unavailable for a break and resume your PulseRoute manifest when you're ready.",
      },
    ],
  }),
  component: BreakScreen,
});

function fmt(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function BreakScreen() {
  const navigate = useNavigate();
  const { data: shift, isLoading } = useActiveShift();
  const setBreak = useSetBreak();
  const paused = shift?.status === "paused";
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!paused || !shift?.break_started_at) return;
    const started = new Date(shift.break_started_at).getTime();
    const tick = () => setElapsed(Math.max(0, Math.round((Date.now() - started) / 1000)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [paused, shift?.break_started_at]);

  if (!isLoading && !shift) {
    return (
      <AppShell bottomNav>
        <OffShiftState />
      </AppShell>
    );
  }

  return (
    <AppShell bottomNav className="flex flex-col">
      <ScreenHeader
        title="Break"
        subtitle={paused ? "You're unavailable — no new stops" : "Take a paid break when it's safe to stop"}
        left={
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${paused ? "bg-warning/20 text-warning" : "bg-surface-2 text-muted-foreground"}`}
          >
            <Coffee className="h-5 w-5" />
          </span>
        }
        right={<Pill tone={paused ? "warning" : "success"}>{paused ? "On break" : "Available"}</Pill>}
      />

      <div className="space-y-3 px-4 py-6">
        <div className="rounded-2xl border border-border bg-surface px-4 py-8 text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            {paused ? "Break time" : "Break time this shift"}
          </p>
          <p className="mt-2 font-mono text-5xl font-bold tabular-nums">
            {fmt(paused ? elapsed : (shift?.break_seconds ?? 0))}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {paused
              ? "Dispatch is holding new stops until you resume."
              : "Your route stays live while you're available."}
          </p>
        </div>

        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="rounded-xl border border-border bg-surface px-4 py-3">
            Park legally and secure the cargo before stepping away.
          </li>
          <li className="rounded-xl border border-border bg-surface px-4 py-3">
            Proof of service already captured stays queued and safe.
          </li>
        </ul>
      </div>

      <div className="mt-auto space-y-2 border-t border-border/70 bg-background px-4 pt-3 pb-3">
        {paused ? (
          <BigButton
            tone="success"
            disabled={setBreak.isPending}
            onClick={async () => {
              await setBreak.mutateAsync({
                shiftId: shift!.id,
                start: false,
                seconds: (shift?.break_seconds ?? 0) + elapsed,
              });
              toast.success("Back on route");
              navigate({ to: "/manifest" });
            }}
          >
            <Play className="h-5 w-5" /> Resume shift
          </BigButton>
        ) : (
          <BigButton
            tone="warning"
            disabled={setBreak.isPending}
            onClick={async () => {
              await setBreak.mutateAsync({ shiftId: shift!.id, start: true });
              toast.message("Break started — you're unavailable");
            }}
          >
            <Pause className="h-5 w-5" /> Start break
          </BigButton>
        )}
      </div>
    </AppShell>
  );
}
