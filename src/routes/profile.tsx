import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  ChevronRight,
  CloudOff,
  Coffee,
  Flag,
  Gauge,
  History,
  LineChart,
  LogOut,
  Pencil,
  Phone,
  Settings,
  ShieldAlert,
  Truck,
} from "lucide-react";
import { DriverAvatar } from "@/components/pulse/avatar";
import { AppShell, Pill, ScreenHeader } from "@/components/pulse/shell";
import {
  MANIFEST_CODE,
  useActiveShift,
  useDriver,
  useMessages,
  useOfflineMode,
} from "@/lib/pulse-data";
import { useUnitPrefs } from "@/lib/units";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Driver Profile — PulseRoute" },
      {
        name: "description",
        content:
          "Driver identity, profile photo, assigned vehicle, current manifest and shift controls including breaks, history and clock-out.",
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
  const fmt = useUnitPrefs();
  const { data: shift } = useActiveShift();
  const { data: driver } = useDriver();
  const { data: messages = [] } = useMessages();
  const offline = useOfflineMode();
  const unread = messages.filter((m) => !m.read).length;

  return (
    <AppShell bottomNav>
      <ScreenHeader
        title={driver?.display_name ?? "Driver Profile"}
        subtitle={`${driver?.company ?? "Apex Move Dynamics"} • ID ${driver?.driver_code ?? "—"}`}
        left={<DriverAvatar size={44} />}
        right={
          <Pill tone={shift?.status === "active" ? "success" : shift?.status === "paused" ? "warning" : "muted"}>
            {shift?.status === "active" ? "On shift" : shift?.status === "paused" ? "On break" : "Off shift"}
          </Pill>
        }
      />
      <div className="space-y-3 px-4 py-4">
        <Link
          to="/profile/edit"
          className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-primary/40 bg-primary/10 px-3 py-3"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Pencil className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold">Edit profile &amp; photo</span>
            <span className="block truncate text-xs text-muted-foreground">
              Name, photo, phone, emergency contact, language
            </span>
          </span>
          <ChevronRight className="h-5 w-5 text-primary" />
        </Link>

        <Row icon={<Truck className="h-5 w-5 text-primary" />} label="Assigned asset" value={driver?.vehicle ?? "—"} />
        <Row icon={<Flag className="h-5 w-5 text-warning" />} label="Active manifest" value={`#${MANIFEST_CODE}`} />
        <Row
          icon={<Phone className="h-5 w-5 text-muted-foreground" />}
          label="Mobile"
          value={driver?.phone ?? "Not set"}
        />
        <Row
          icon={<ShieldAlert className="h-5 w-5 text-muted-foreground" />}
          label="Emergency contact"
          value={driver?.emergency_contact ?? "Not set"}
        />
        <Row
          icon={<Gauge className="h-5 w-5 text-muted-foreground" />}
          label="Odometer at start"
          value={shift?.odometer_start ? fmt.mi(Number(shift.odometer_start)) : "—"}
        />
        <Row
          icon={<CloudOff className={`h-5 w-5 ${offline ? "text-warning" : "text-success"}`} />}
          label="Connectivity"
          value={offline ? "Offline — queueing locally" : "Online — syncing live"}
        />

        <NavLink to="/notifications" icon={<Bell className="h-4 w-4" />} label="Dispatch messages" badge={unread} />
        <NavLink to="/break" icon={<Coffee className="h-4 w-4" />} label="Break & availability" />
        <NavLink to="/history" icon={<History className="h-4 w-4" />} label="Shift history" />
        <NavLink to="/performance" icon={<LineChart className="h-4 w-4" />} label="Performance" />
        <NavLink to="/settings" icon={<Settings className="h-4 w-4" />} label="Settings" />
        <NavLink to="/offline" icon={<CloudOff className="h-4 w-4" />} label="Offline sync queue" />

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

function NavLink({
  to,
  icon,
  label,
  badge,
}: {
  to: "/notifications" | "/break" | "/history" | "/performance" | "/settings" | "/offline";
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <Link
      to={to}
      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-surface-2 px-3 py-3 text-sm font-bold"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-muted-foreground">
        {icon}
      </span>
      <span className="truncate">{label}</span>
      <span className="flex items-center gap-2">
        {badge ? <Pill tone="warning">{badge}</Pill> : null}
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </span>
    </Link>
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
