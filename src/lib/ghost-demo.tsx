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
import { useRole } from "@/lib/role-context";
import { demoInjectPriorityStop } from "@/lib/demo-manifest";

export type GhostPhase = "idle" | "courier" | "anomaly" | "reassign" | "telemetry";

type Cursor = { x: number; y: number; pressed: boolean; visible: boolean };

export type GhostCaption = {
  /** "step" is the running narration strip; "role" is the mode hand-off card. */
  kind: "step" | "role";
  role: "courier" | "dispatch";
  title: string;
  body: string;
  /** 1-based index of this step within its role sequence, for the progress hint. */
  step?: number;
  total?: number;
};

type GhostValue = {
  running: boolean;
  phase: GhostPhase;
  /** True while the scripted vehicle is animating along the navigation route. */
  driving: boolean;
  cursor: Cursor;
  caption: GhostCaption | null;
  /** Every caption shown so far this run, so viewers can step back over missed notes. */
  history: GhostCaption[];
  /** Master switch for the narration strip (role hand-off cards always show). */
  captionsOn: boolean;
  toggleCaptions: () => void;
  start: () => void;
  stop: () => void;
};

const GhostContext = createContext<GhostValue | null>(null);

class Cancelled extends Error {}

/** Hands-free "ghost user" that drives the real UI end to end. */
export function GhostProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setActiveRole } = useRole();
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<GhostPhase>("idle");
  const [driving, setDriving] = useState(false);
  const [cursor, setCursor] = useState<Cursor>({ x: 0, y: 0, pressed: false, visible: false });
  const [caption, setCaption] = useState<GhostCaption | null>(null);
  const token = useRef(0);

  const stop = useCallback(() => {
    token.current += 1;
    setRunning(false);
    setPhase("idle");
    setDriving(false);
    setCaption(null);
    setCursor((c) => ({ ...c, visible: false, pressed: false }));
  }, []);

  const start = useCallback(() => {
    token.current += 1;
    const mine = token.current;
    setRunning(true);
    setPhase("courier");
    setCursor({
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.7,
      pressed: false,
      visible: true,
    });

    const alive = () => {
      if (token.current !== mine) throw new Cancelled();
    };

    /** Playback pace: >1 slows every scripted pause so viewers can read along. */
    const PACE = 1.6;

    const sleep = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        const id = window.setTimeout(() => {
          if (token.current !== mine) reject(new Cancelled());
          else resolve();
        }, Math.round(ms * PACE));
        void id;
      });

    function find(text: string): HTMLElement | null {
      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>('button, a, [role="button"]'),
      );
      const needle = text.toLowerCase();
      return (
        nodes.find((node) => {
          if (node.offsetParent === null && node.getClientRects().length === 0) return false;
          const label = `${node.getAttribute("aria-label") ?? ""} ${node.textContent ?? ""}`;
          return label.toLowerCase().includes(needle);
        }) ?? null
      );
    }

    async function waitFor(text: string, timeout = 6000) {
      const deadline = Date.now() + timeout;
      for (;;) {
        alive();
        const el = find(text);
        if (el) return el;
        if (Date.now() > deadline) return null;
        await sleep(200);
      }
    }

    async function moveTo(el: HTMLElement) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      await sleep(450);
      alive();
      const rect = el.getBoundingClientRect();
      setCursor({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        pressed: false,
        visible: true,
      });
      await sleep(700);
    }

    /** Move the touch indicator onto a control, press it, then fire the real click. */
    async function tap(text: string, timeout = 6000) {
      const el = await waitFor(text, timeout);
      if (!el) return false;
      await moveTo(el);
      setCursor((c) => ({ ...c, pressed: true }));
      await sleep(220);
      alive();
      el.click();
      setCursor((c) => ({ ...c, pressed: false }));
      await sleep(900);
      return true;
    }

    async function scrollBy(y: number) {
      const scroller =
        document.querySelector<HTMLElement>("[data-app-scroll]") ??
        document.scrollingElement ??
        document.body;
      scroller.scrollBy({ top: y, behavior: "smooth" });
      await sleep(900);
    }

    /** Narrate the current step so a first-time viewer knows what they're seeing. */
    function say(step: number, title: string, body: string) {
      setCaption({ kind: "step", role: "courier", title, body, step, total: 8 });
    }

    function sayDispatch(step: number, title: string, body: string) {
      setCaption({ kind: "step", role: "dispatch", title, body, step, total: 4 });
    }

    async function run() {
      /* ---------------- Courier: Marcus Vance ---------------- */
      setActiveRole("field_technician");

      setCaption({
        kind: "role",
        role: "courier",
        title: "Courier mode — Marcus Vance",
        body: "What the driver holds in the van: one stop at a time, big buttons, works with no signal. Everything you're about to see is the real app being tapped for you.",
      });
      await sleep(4200);

      if (window.location.pathname === "/auth") {
        say(1, "Signing in", "One-tap demo sign-in as courier Marcus Vance, Van #408, route RT-8842.");
        await tap("Demo Courier", 8000);
        await sleep(1400);
      }

      // Pre-trip checks + shift start
      if (await waitFor("Start Shift", 4000)) {
        say(
          2,
          "Pre-trip inspection",
          "Before the wheels move: tyres, brakes, lights and load are signed off, and the odometer is logged.",
        );
        await scrollBy(240);
        await tap("Start Shift");
        await sleep(1600);
      }

      // Manifest: read the manifest, then open navigation for the active stop.
      await waitFor("Start Navigation", 8000);
      say(
        3,
        "Today's stop list",
        "Five stops in delivery order with time windows. The courier only acts on the top one.",
      );
      await scrollBy(220);
      await scrollBy(-220);
      await tap("Start Navigation");
      await sleep(1200);
      alive();

      const seq = window.location.pathname.split("/").pop() || "2";

      // Parcel scanning at the van
      await navigate({ to: "/scan/$seq", params: { seq } });
      say(
        4,
        "Scanning the parcels",
        "Each barcode is checked against the manifest, so the wrong box can never leave the van.",
      );
      await sleep(1800);
      for (let i = 0; i < 4; i += 1) {
        alive();
        if (!find("Confirm Package Stowed")) break;
        await tap("Confirm Package Stowed", 3000);
        await sleep(700);
      }
      await tap("All parcels stowed", 4000);
      await sleep(1200);

      // Turn-by-turn transit
      alive();
      say(
        5,
        "Driving to the stop",
        "Turn-by-turn guidance with live speed and distance. The van follows the route to the marked destination.",
      );
      setDriving(true);
      await sleep(5400);
      setDriving(false);
      say(6, "Arrived", "Geofence confirms the van is at the door, so the delivery can be closed out.");
      await sleep(1200);

      // Arrival + proof of delivery
      await tap("Arrived at Stop", 5000);
      await sleep(1200);
      say(
        7,
        "Proof of delivery",
        "Camera photographs the parcel where it was left, then the recipient signs on the glass.",
      );
      await tap("Capture Parcel Photo", 5000);
      await sleep(3400); // camera focus, shutter, then the signature is written
      await tap("Drop-Off", 6000);
      await sleep(2000);

      // Manifest reflects the completed stop
      alive();
      say(8, "Stop closed", "The stop is ticked off and the proof syncs to dispatch — or queues if offline.");
      await navigate({ to: "/manifest" });
      await sleep(2600);

      /* ---------------- Dispatch supervisor ---------------- */
      alive();
      setCaption({
        kind: "role",
        role: "dispatch",
        title: "Switching to Dispatch Supervisor",
        body: "Same data, opposite chair. The supervisor never drives — they watch every van at once, spot problems early and move work between couriers.",
      });
      await sleep(4800);
      setActiveRole("dispatch_supervisor");
      await navigate({ to: "/manifest" });
      sayDispatch(
        1,
        "Live fleet console",
        "Every van, its driver and its progress on one map, with fleet-wide on-time numbers above it.",
      );
      await sleep(2600);

      setPhase("anomaly");
      sayDispatch(
        2,
        "A problem surfaces",
        "Van #212 leaves its geofence with a maintenance flag — dispatch is alerted before the customer complains.",
      );
      toast.error("Route 4 — delivery delayed 18 min", {
        description: "Geofence breach + maintenance flag on Van #212 (Dana Whitfield).",
        duration: 5000,
      });
      await sleep(2600);

      await tap("Van #212 telemetry", 5000);
      await sleep(1600);
      setPhase("reassign");
      sayDispatch(
        3,
        "Moving the work",
        "The priority parcel is pulled off the delayed van and pushed to Marcus Vance — his stop list updates instantly.",
      );
      const reassigned = await tap("Reassign APX-9001", 5000);
      if (reassigned) {
        demoInjectPriorityStop();
        void queryClient.invalidateQueries({ queryKey: ["stops"] });
        void queryClient.invalidateQueries({ queryKey: ["packages"] });
        toast.success("APX-9001 reassigned to Marcus Vance", {
          description: "Priority parcel pushed to Van #408 — courier notified.",
        });
      }
      await sleep(2600);

      setPhase("telemetry");
      sayDispatch(
        4,
        "End-of-day picture",
        "Stops completed, on-time rate and fuel saved — the numbers a depot manager reports on.",
      );
      await scrollBy(-400);
      await sleep(4600);

      setCaption({
        kind: "role",
        role: "dispatch",
        title: "That's the full loop",
        body: "Courier and dispatch, one system. Use the role switch any time to explore either side yourself.",
      });
      await sleep(4200);

      setCursor((c) => ({ ...c, visible: false }));
      setCaption(null);
      setRunning(false);
      setPhase("idle");
    }

    run().catch((error) => {
      if (error instanceof Cancelled) return;
      console.error(error);
      setRunning(false);
      setPhase("idle");
      setDriving(false);
      setCaption(null);
      setCursor((c) => ({ ...c, visible: false }));
    });
  }, [navigate, queryClient, setActiveRole]);

  useEffect(() => () => void (token.current += 1), []);

  const value = useMemo<GhostValue>(
    () => ({ running, phase, driving, cursor, caption, start, stop }),
    [running, phase, driving, cursor, caption, start, stop],
  );

  return <GhostContext.Provider value={value}>{children}</GhostContext.Provider>;
}

export function useGhost() {
  const ctx = useContext(GhostContext);
  if (!ctx) throw new Error("useGhost must be used inside GhostProvider");
  return ctx;
}
