import { createFileRoute, Link } from "@tanstack/react-router";
import { CloudOff, Flashlight, Gauge, LogOut, Navigation, Ruler, Vibrate } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Pill, ScreenHeader } from "@/components/pulse/shell";
import { supabase } from "@/integrations/supabase/client";
import { setOfflineMode, useDriver, useOfflineMode, useUpdateDriver } from "@/lib/pulse-data";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — PulseRoute" },
      {
        name: "description",
        content:
          "Choose your navigation app, torch default, haptics and distance units, and simulate offline mode for training.",
      },
      { property: "og:title", content: "Settings — PulseRoute" },
      {
        property: "og:description",
        content: "Device and navigation preferences for the PulseRoute driver app.",
      },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { data: driver } = useDriver();
  const update = useUpdateDriver();
  const offline = useOfflineMode();

  function patch(next: Parameters<typeof update.mutate>[0]["patch"], label: string) {
    if (!driver) return;
    update.mutate({ id: driver.id, patch: next });
    toast.success(label);
  }

  return (
    <AppShell bottomNav>
      <ScreenHeader title="Settings" subtitle="Device & navigation preferences" />
      <div className="space-y-3 px-4 py-4">
        <p className="px-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Navigation
        </p>
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          {(
            [
              ["built_in", "PulseRoute built-in"],
              ["google", "Google Maps"],
              ["apple", "Apple Maps"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => patch({ nav_preference: value }, `Navigation set to ${label}`)}
              className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border/60 px-3 py-3 text-left last:border-b-0"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2">
                <Navigation className="h-4 w-4 text-primary" />
              </span>
              <span className="truncate text-sm font-semibold">{label}</span>
              {driver?.nav_preference === value ? <Pill tone="primary">Selected</Pill> : null}
            </button>
          ))}
        </div>

        <p className="px-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Device
        </p>
        <Toggle
          icon={<Flashlight className="h-4 w-4 text-warning" />}
          label="Torch on when scanner opens"
          on={Boolean(driver?.torch_default)}
          onToggle={() =>
            patch(
              { torch_default: !driver?.torch_default },
              driver?.torch_default ? "Torch default off" : "Torch default on",
            )
          }
        />
        <Toggle
          icon={<Vibrate className="h-4 w-4 text-primary" />}
          label="Haptic feedback on scan"
          on={Boolean(driver?.haptics)}
          onToggle={() =>
            patch({ haptics: !driver?.haptics }, driver?.haptics ? "Haptics off" : "Haptics on")
          }
        />
        <Toggle
          icon={<Ruler className="h-4 w-4 text-muted-foreground" />}
          label={driver?.units === "metric" ? "Units: metric (km)" : "Units: imperial (mi)"}
          on={driver?.units === "metric"}
          onToggle={() =>
            patch(
              { units: driver?.units === "metric" ? "imperial" : "metric" },
              driver?.units === "metric" ? "Switched to miles" : "Switched to kilometres",
            )
          }
        />

        <p className="px-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Connectivity
        </p>
        <Toggle
          icon={<CloudOff className={`h-4 w-4 ${offline ? "text-warning" : "text-success"}`} />}
          label="Simulate offline mode"
          on={offline}
          onToggle={() => {
            setOfflineMode(!offline);
            toast.message(offline ? "Network restored" : "Offline mode on — work queues locally");
          }}
        />
        <Link
          to="/performance"
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 text-sm font-bold"
        >
          <Gauge className="h-4 w-4" /> Performance detail
        </Link>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            toast.message("Signed out");
          }}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-destructive/60 bg-destructive/15 text-sm font-bold text-destructive"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </AppShell>
  );
}

function Toggle({
  icon,
  label,
  on,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3 text-left"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2">
        {icon}
      </span>
      <span className="truncate text-sm font-semibold">{label}</span>
      <span
        className={`flex h-6 w-11 shrink-0 items-center rounded-full border px-0.5 transition-colors ${
          on ? "border-primary bg-primary/30" : "border-border bg-surface-2"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full transition-transform ${on ? "translate-x-5 bg-primary" : "bg-muted-foreground/60"}`}
        />
      </span>
    </button>
  );
}
