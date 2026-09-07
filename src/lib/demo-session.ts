import { useEffect, useState } from "react";

/** Local-only courier session used by the one-tap demo button (no network auth). */
export type DemoSession = {
  demo: true;
  user: {
    id: string;
    email: string;
    user_metadata: { full_name: string; role: string };
  };
};

const DEMO_KEY = "pulseroute.demo-session.v1";
const DEMO_EVENT = "pulseroute:demo-session";

export const DEMO_SESSION: DemoSession = {
  demo: true,
  user: {
    id: "demo-courier-marcus-vance",
    email: "driver@apexmove.internal",
    user_metadata: { full_name: "Marcus Vance", role: "technician" },
  },
};

export function readDemoSession(): DemoSession | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(DEMO_KEY) ? DEMO_SESSION : null;
  } catch {
    return null;
  }
}

export function startDemoSession() {
  window.localStorage.setItem(DEMO_KEY, JSON.stringify(DEMO_SESSION));
  window.dispatchEvent(new Event(DEMO_EVENT));
}

export function endDemoSession() {
  window.localStorage.removeItem(DEMO_KEY);
  window.dispatchEvent(new Event(DEMO_EVENT));
}

export function isDemoSession() {
  return readDemoSession() !== null;
}

export function useDemoSession() {
  const [demo, setDemo] = useState<DemoSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setDemo(readDemoSession());
      setReady(true);
    };
    sync();
    window.addEventListener(DEMO_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DEMO_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { demo, ready };
}
