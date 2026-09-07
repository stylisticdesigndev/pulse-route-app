import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useDemoSession, type DemoSession } from "@/lib/demo-session";

/** Tracks the signed-in Apex staff session (or the local demo courier session). */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const { demo, ready: demoReady } = useDemoSession();

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next ?? null);
      setReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const merged: Session | DemoSession | null = session ?? demo;
  return { session: merged, ready: ready && demoReady, isDemo: Boolean(!session && demo) };
}
