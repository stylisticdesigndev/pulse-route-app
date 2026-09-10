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
  const token = useRef(0);

  const stop = useCallback(() => {
    token.current += 1;
    setRunning(false);
    setPhase("idle");
    setDriving(false);
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

    const sleep = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        const id = window.setTimeout(() => {
          if (token.current !== mine) reject(new Cancelled());
          else resolve();
        }, ms);
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

    async function run() {
      /* ---------------- Courier: Marcus Vance ---------------- */
      setActiveRole("field_technician");

      if (window.location.pathname === "/auth") {
        await tap("Demo Courier", 8000);
        await sleep(1400);
      }

      // Pre-trip checks + shift start
      if (await waitFor("Start Shift", 4000)) {
        await scrollBy(240);
        await tap("Start Shift");
        await sleep(1600);
      }

      // Manifest: read the manifest, then open navigation for the active stop.
      await waitFor("Start Navigation", 8000);
      await scrollBy(220);
      await scrollBy(-220);
      await tap("Start Navigation");
      await sleep(1200);
      alive();

      const seq = window.location.pathname.split("/").pop() || "2";

      // Parcel scanning at the van
      await navigate({ to: "/scan/$seq", params: { seq } });
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
      setDriving(true);
      await sleep(5200);
      setDriving(false);
      await sleep(600);

      // Arrival + proof of delivery
      await tap("Arrived at Stop", 5000);
      await sleep(1400);
      await tap("Capture Parcel Photo", 5000);
      await sleep(1900); // signature pad auto-signs here
      await tap("Drop-Off", 6000);
      await sleep(2200);

      // Manifest reflects the completed stop
      alive();
      await navigate({ to: "/manifest" });
      await sleep(2400);

      /* ---------------- Dispatch supervisor ---------------- */
      alive();
      setActiveRole("dispatch_supervisor");
      await navigate({ to: "/manifest" });
      await sleep(1800);

      setPhase("anomaly");
      toast.error("Route 4 — delivery delayed 18 min", {
        description: "Geofence breach + maintenance flag on Van #212 (Dana Whitfield).",
        duration: 5000,
      });
      await sleep(2200);

      await tap("Van #212 telemetry", 5000);
      await sleep(1600);
      setPhase("reassign");
      const reassigned = await tap("Reassign APX-9001", 5000);
      if (reassigned) {
        demoInjectPriorityStop();
        void queryClient.invalidateQueries({ queryKey: ["stops"] });
        void queryClient.invalidateQueries({ queryKey: ["packages"] });
        toast.success("APX-9001 reassigned to Marcus Vance", {
          description: "Priority parcel pushed to Van #408 — courier notified.",
        });
      }
      await sleep(2400);

      setPhase("telemetry");
      await scrollBy(-400);
      await sleep(4200);

      setCursor((c) => ({ ...c, visible: false }));
      setRunning(false);
      setPhase("idle");
    }

    run().catch((error) => {
      if (error instanceof Cancelled) return;
      console.error(error);
      setRunning(false);
      setPhase("idle");
      setDriving(false);
      setCursor((c) => ({ ...c, visible: false }));
    });
  }, [navigate, queryClient, setActiveRole]);

  useEffect(() => () => void (token.current += 1), []);

  const value = useMemo<GhostValue>(
    () => ({ running, phase, driving, cursor, start, stop }),
    [running, phase, driving, cursor, start, stop],
  );

  return <GhostContext.Provider value={value}>{children}</GhostContext.Provider>;
}

export function useGhost() {
  const ctx = useContext(GhostContext);
  if (!ctx) throw new Error("useGhost must be used inside GhostProvider");
  return ctx;
}
