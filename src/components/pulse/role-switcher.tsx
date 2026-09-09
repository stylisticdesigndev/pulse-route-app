import { HardHat, RadioTower, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useRole, type ActiveRole } from "@/lib/role-context";
import { useGhost } from "@/lib/ghost-demo";

const OPTIONS: {
  role: ActiveRole;
  label: string;
  hint: string;
  icon: typeof HardHat;
  tone: string;
}[] = [
  {
    role: "field_technician",
    label: "Field Technician (Driver View)",
    hint: "Manifest, navigation, scanning and proof of service.",
    icon: HardHat,
    tone: "text-primary",
  },
  {
    role: "dispatch_supervisor",
    label: "Dispatch Supervisor (Fleet View)",
    hint: "Fleet overview, live map, assignments and telemetry.",
    icon: RadioTower,
    tone: "text-warning",
  },
];

/** Floating developer role toggle, docked below the top safe area. */
export function RoleSwitcher() {
  const { activeRole, setActiveRole } = useRole();
  const [open, setOpen] = useState(false);
  const { running } = useGhost();
  const tech = activeRole === "field_technician";
  const Icon = tech ? HardHat : RadioTower;

  if (running) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Switch developer role"
        className={cn(
          "fixed right-3 z-50 flex h-9 select-none items-center gap-1.5 rounded-full border border-border bg-card/95 px-3 text-xs font-semibold shadow-lg backdrop-blur",
          tech ? "text-primary" : "text-warning",
        )}
        style={{ top: "max(2.75rem, calc(env(safe-area-inset-top) + 0.5rem))" }}
      >
        <Icon className="h-4 w-4" strokeWidth={2.4} />
        {tech ? "Role: Technician" : "Role: Dispatcher"}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm">
          <button
            aria-label="Close role switcher"
            className="absolute inset-0"
            onClick={() => setOpen(false)}
          />
          <div className="safe-bottom relative w-full rounded-t-2xl border-t border-border bg-card px-4 pt-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold">Developer role</h2>
                <p className="truncate text-xs text-muted-foreground">
                  Preview PulseRoute as either persona
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <ul className="mt-4 space-y-2 pb-2">
              {OPTIONS.map(({ role, label, hint, icon: OptIcon, tone }) => (
                <li key={role}>
                  <button
                    onClick={() => {
                      setActiveRole(role);
                      setOpen(false);
                    }}
                    className={cn(
                      "grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl border px-3 py-3 text-left",
                      activeRole === role
                        ? "border-primary/60 bg-primary/10"
                        : "border-border bg-surface-2",
                    )}
                  >
                    <OptIcon className={cn("h-5 w-5 shrink-0", tone)} strokeWidth={2.3} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{label}</span>
                      <span className="block truncate text-xs text-muted-foreground">{hint}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
