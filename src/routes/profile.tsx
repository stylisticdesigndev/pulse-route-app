import { createFileRoute, Link } from "@tanstack/react-router";
import { CloudOff, Flag, Gauge, LogOut, Truck } from "lucide-react";
import { AppShell, Pill, ScreenHeader } from "@/components/pulse/shell";
import { DRIVER, MANIFEST_CODE, useActiveShift, useOfflineMode } from "@/lib/pulse-data";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Driver Profile — PulseRoute" },
      {
        name: "description",
        content:
          "Driver identity, assigned vehicle, current manifest and shift controls including offline mode and clock-out.",
      },
      { property: "og:title", content: "Driver Profile — PulseRoute" },
      {
        property: "og:description",
        content: "Driver, vehicle and shift controls for the PulseRoute fleet gateway.",
      },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { data: shift } = useActiveShift();
  const offline = useOfflineMode();

  return (
    <AppShell bottomNav>
      <ScreenHeader
        title="Driver Profile"
        subtitle={`${DRIVER.company} • ID ${DRIVER.code}`}
        left={
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground">
            MV
          </span>
        }
        right={<Pill tone={shift?.status === "active" ? "success" : "muted"}>
          {shift?.status === "active" ? "On shift" : "Off shift"}
        </Pill>}
      />
      <div className="space-y-3 px-4 py-4">
        <Row icon={<Truck className="h-5 w-5 text-primary" />} label="Assigned asset" value={DRIVER.vehicle} />
        <Row icon={<Flag className="h-5 w-5 text-warning" />} label="Active manifest" value={`#${MANIFEST_CODE}`} />
        <Row
          icon={<Gauge className="h-5 w-5 text-muted-foreground" />}
          label="Odometer at start"
          value={shift?.odometer_start ? `${Number(shift.odometer_start).toLocaleString()} mi` : "—"}
        />
        <Row
          icon={<CloudOff className={`h-5 w-5 ${offline ? "text-warning" : "text-success"}`} />}
          label="Connectivity"
          value={offline ? "Offline — queueing locally" : "Online — syncing live"}
        />

        <Link
          to="/offline"
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 text-sm font-bold"
        >
          <CloudOff className="h-4 w-4" /> Offline sync queue
        </Link>
        <Link
          to="/summary"
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-destructive/50 bg-destructive/10 text-sm font-bold text-destructive"
        >
          <LogOut className="h-4 w-4" /> End shift &amp; clock out
        </Link>
      </div>
    </AppShell>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2">
        {icon}
      </span>
      <span className="truncate text-sm text-muted-foreground">{label}</span>
      <span className="truncate text-sm font-bold">{value}</span>
    </div>
  );
}
