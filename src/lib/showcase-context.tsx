import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useRole, type ActiveRole } from "@/lib/role-context";
import { demoInjectPriorityStop } from "@/lib/demo-manifest";

export type ShowcaseStep = {
  id: string;
  role: ActiveRole;
  route: string;
  screen: string;
  roleContext: string;
  intent: string;
  architecture: string;
  /** Optional side effect fired when the step becomes active. */
  onEnter?: (ctx: { toastAlert: () => void; injectParcel: () => void }) => void;
};

export const SUPERVISOR_STEPS: ShowcaseStep[] = [
  {
    id: "fleet-overview",
    role: "dispatch_supervisor",
    route: "/manifest",
    screen: "Real-Time Fleet Overview",
    roleContext: "Dispatch Supervisor — Operations Control",
    intent:
      "Macro-level fleet triage: live courier breadcrumbs, battery levels and route completion across the whole metro, readable in one glance.",
    architecture:
      "High-density data visualisation on a responsive grid that scales from phone to tablet and desktop; markers and telemetry rows share one polled snapshot of fleet state.",
  },
  {
    id: "anomaly",
    role: "dispatch_supervisor",
    route: "/manifest",
    screen: "Anomaly Detection & Geofence Alert",
    roleContext: "Dispatch Supervisor — Operations Control",
    intent:
      "Surface a delayed delivery and a maintenance flag on Route 4 the moment they breach the geofence, without burying the rest of the board.",
    architecture:
      "Event-driven alert pipeline feeding a priority hierarchy: critical alerts raise a toast, secondary anomalies stay inline as amber banners.",
    onEnter: ({ toastAlert }) => toastAlert(),
  },
  {
    id: "reassign",
    role: "dispatch_supervisor",
    route: "/manifest",
    screen: "Dynamic Route Reassignment",
    roleContext: "Dispatch Supervisor — Operations Control",
    intent:
      "Move a high-priority parcel off the delayed courier and onto Marcus Vance in a single deliberate action, with the outcome visible instantly.",
    architecture:
      "Optimistic UI update applied to the local cache first, conflict-free state mutation reconciled on sync, then a push notification to the receiving courier.",
    onEnter: ({ injectParcel }) => injectParcel(),
  },
  {
    id: "telemetry",
    role: "dispatch_supervisor",
    route: "/manifest",
    screen: "Fleet Telemetry & End-of-Shift Analytics",
    roleContext: "Dispatch Supervisor — Operations Control",
    intent:
      "Executive-ready close-out: stops completed, on-time rate climbing to 98% and carbon offset, updating live as the shift lands.",
    architecture:
      "Local mock aggregation over the shift event log, memoised per render and animated so trend direction reads without a chart.",
  },
];

export const COURIER_STEPS: ShowcaseStep[] = [
  {
    id: "courier-manifest",
    role: "field_technician",
    route: "/manifest",
    screen: "Active Manifest",
    roleContext: "Field Courier — Marcus Vance, Van #408",
    intent:
      "Tactical glanceability: one active stop, one primary action, thumb-reachable while the driver is still buckling in.",
    architecture:
      "Client-side state machine drives stop status transitions; safe-area insets keep the header clear of the Dynamic Island and the nav clear of the home bar.",
  },
  {
    id: "courier-nav",
    role: "field_technician",
    route: "/nav/1",
    screen: "Turn-by-Turn Navigation",
    roleContext: "Field Courier — Marcus Vance, Van #408",
    intent:
      "Oversized type and a single instruction per frame so the next manoeuvre is legible at a glance from the driver's seat.",
    architecture:
      "Route geometry rendered as vector layers, distances and clocks formatted through the global unit preference store.",
  },
  {
    id: "courier-stop",
    role: "field_technician",
    route: "/stop/1",
    screen: "Stop Detail & Proof of Service",
    roleContext: "Field Courier — Marcus Vance, Van #408",
    intent:
      "Everything needed at the door — recipient, access notes, parcels — then capture proof without leaving the screen.",
    architecture:
      "Optimistic status writes queue offline and replay on reconnect; signature capture is local canvas data promoted to storage on sync.",
  },
  {
    id: "courier-summary",
    role: "field_technician",
    route: "/summary",
    screen: "End-of-Shift Summary",
    roleContext: "Field Courier — Marcus Vance, Van #408",
    intent:
      "Close the loop for the driver: what was delivered, what returns to depot, and a clean hand-off to dispatch.",
    architecture:
      "Derived entirely from the local shift log, so the summary renders identically online and offline.",
  },
];

export const ALL_STEPS = [...SUPERVISOR_STEPS, ...COURIER_STEPS];

export type Speed = 1 | 2 | 4;

type ShowcaseValue = {
  active: boolean;
  playing: boolean;
  speed: Speed;
  index: number;
  step: ShowcaseStep | null;
  steps: ShowcaseStep[];
  start: (role?: ActiveRole) => void;
  exit: () => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  cycleSpeed: () => void;
  goToRole: (role: ActiveRole) => void;
  jumpToCourierHandoff: () => void;
};

const ShowcaseContext = createContext<ShowcaseValue | null>(null);

const BASE_MS = 7000;

/** Scripted dual-role portfolio tour: playback state machine + explainer content. */
export function ShowcaseProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setActiveRole } = useRole();
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [index, setIndex] = useState(0);
  const lastFired = useRef<string | null>(null);

  const step = active ? (ALL_STEPS[index] ?? null) : null;

  const effects = useMemo(
    () => ({
      toastAlert: () => {
        toast.error("Route 4 — delivery delayed 18 min", {
          description: "Geofence breach + maintenance flag on Van #212 (Dana Whitfield).",
          duration: 6000,
        });
      },
      injectParcel: () => {
        demoInjectPriorityStop();
        void queryClient.invalidateQueries({ queryKey: ["stops"] });
        void queryClient.invalidateQueries({ queryKey: ["packages"] });
        toast.success("APX-9001 reassigned to Marcus Vance", {
          description: "Priority parcel pushed to Van #408 — courier notified.",
          duration: 5000,
        });
      },
    }),
    [queryClient],
  );

  // Apply role + route + one-shot side effect for the current step.
  useEffect(() => {
    if (!step) return;
    setActiveRole(step.role);
    void navigate({ to: step.route, replace: true });
    if (lastFired.current !== step.id) {
      lastFired.current = step.id;
      step.onEnter?.(effects);
    }
  }, [step, setActiveRole, navigate, effects]);

  const next = useCallback(() => {
    setIndex((i) => Math.min(i + 1, ALL_STEPS.length - 1));
  }, []);
  const prev = useCallback(() => {
    lastFired.current = null;
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    if (!active || !playing) return;
    const id = window.setTimeout(() => {
      if (index >= ALL_STEPS.length - 1) setPlaying(false);
      else next();
    }, BASE_MS / speed);
    return () => window.clearTimeout(id);
  }, [active, playing, index, speed, next]);

  const value = useMemo<ShowcaseValue>(
    () => ({
      active,
      playing,
      speed,
      index,
      step,
      steps: ALL_STEPS,
      start: (role) => {
        lastFired.current = null;
        setIndex(role === "field_technician" ? SUPERVISOR_STEPS.length : 0);
        setActive(true);
        setPlaying(true);
      },
      exit: () => {
        setActive(false);
        setPlaying(false);
        lastFired.current = null;
      },
      play: () => setPlaying(true),
      pause: () => setPlaying(false),
      next,
      prev,
      cycleSpeed: () => setSpeed((s) => (s === 1 ? 2 : s === 2 ? 4 : 1)),
      goToRole: (role) => {
        lastFired.current = null;
        setIndex(role === "field_technician" ? SUPERVISOR_STEPS.length : 0);
        setActive(true);
      },
      jumpToCourierHandoff: () => {
        setIndex(SUPERVISOR_STEPS.length);
        setActive(true);
      },
    }),
    [active, playing, speed, index, step, next, prev],
  );

  return <ShowcaseContext.Provider value={value}>{children}</ShowcaseContext.Provider>;
}

export function useShowcase() {
  const ctx = useContext(ShowcaseContext);
  if (!ctx) throw new Error("useShowcase must be used inside ShowcaseProvider");
  return ctx;
}
