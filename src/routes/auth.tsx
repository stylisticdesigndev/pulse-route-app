import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { HardHat, Lock, Navigation, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, BigButton } from "@/components/pulse/shell";
import { supabase } from "@/integrations/supabase/client";
import { startDemoCourierSession } from "@/lib/demo-auth.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "PulseRoute — Driver Sign In | Apex Move Dynamics" },
      {
        name: "description",
        content:
          "Sign in to PulseRoute to load your Apex Move Dynamics manifest, or open the read-only demo courier session.",
      },
      { property: "og:title", content: "PulseRoute — Driver Sign In" },
      {
        property: "og:description",
        content: "Secure sign-in for Apex Move Dynamics couriers and dispatch supervisors.",
      },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"demo" | "password" | null>(null);

  /** Local-only demo courier session — no network auth call, so it can never fail. */
  function signInDemo() {
    setBusy("demo");
    startDemoSession();
    toast.success("Signed in as demo courier (Marcus Vance)");
    navigate({ to: "/manifest", replace: true });
    setBusy(null);
  }



  async function signInPassword(event: React.FormEvent) {
    event.preventDefault();
    setBusy("password");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/" });
    } catch {
      toast.error("Those credentials didn't match.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppShell className="flex flex-col">
      <div className="safe-top flex flex-1 flex-col justify-center gap-6 px-5 pb-10">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-[0_10px_30px_-10px_var(--primary)]">
            <Navigation className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">PulseRoute</h1>
            <p className="text-xs font-medium text-muted-foreground">Apex Move Dynamics</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-[color:var(--success,#10B981)]" />
            Manifest data is locked to signed-in staff
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Customer addresses, phone numbers, gate codes and proof-of-service files are only
            readable once you sign in.
          </p>
        </div>

        <BigButton onClick={signInDemo} disabled={busy !== null}>
          <HardHat className="h-5 w-5" strokeWidth={2.5} />
          {busy === "demo" ? "Opening demo session…" : "Sign in as Demo Courier (Marcus Vance)"}
        </BigButton>

        <form onSubmit={signInPassword} className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Apex staff credentials
          </div>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@apexmove.internal"
            className="h-13 w-full rounded-xl border border-border bg-card px-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="h-13 w-full rounded-xl border border-border bg-card px-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={busy !== null}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary text-sm font-semibold text-foreground disabled:opacity-60"
          >
            <Lock className="h-4 w-4" />
            {busy === "password" ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
