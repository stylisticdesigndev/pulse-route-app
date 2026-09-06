import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  LifeBuoy,
  MapPinOff,
  PhoneOff,
  Radio,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, BigButton, Pill, ScreenHeader } from "@/components/pulse/shell";
import { EmptyState } from "@/components/pulse/states";
import { stopLabel, useSendDispatchNote, useStops } from "@/lib/pulse-data";

export const Route = createFileRoute("/help_/$seq")({
  head: () => ({
    meta: [
      { title: "Stop Help — PulseRoute" },
      {
        name: "description",
        content:
          "Can't find the address, recipient unreachable or the location feels unsafe? Escalate the stop to dispatch in one tap.",
      },
      { property: "og:title", content: "Stop Help — PulseRoute" },
      {
        property: "og:description",
        content: "Driver escape hatch for problem stops on the PulseRoute manifest.",
      },
    ],
  }),
  component: StopHelp,
});

const OPTIONS = [
  {
    id: "address",
    icon: MapPinOff,
    title: "Can't find the address",
    body: "Dispatch will confirm the door, unit number and access route.",
  },
  {
    id: "recipient",
    icon: PhoneOff,
    title: "Recipient unreachable",
    body: "No answer at the door and the phone rings out.",
  },
  {
    id: "unsafe",
    icon: ShieldAlert,
    title: "Location feels unsafe",
    body: "Leave the stop, log the hazard and let dispatch reassign it.",
  },
  {
    id: "dispatch",
    icon: Radio,
    title: "Contact dispatch",
    body: "Send a live note and hold on this stop for instructions.",
  },
] as const;

function StopHelp() {
  const { seq } = useParams({ from: "/help_/$seq" });
  const navigate = useNavigate();
  const { data: stops = [] } = useStops();
  const stop = stops.find((s) => s.seq === Number(seq));
  const send = useSendDispatchNote();
  const [sent, setSent] = useState<string | null>(null);

  if (!stops.length) {
    return (
      <AppShell bottomNav>
        <div className="px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">Loading stop…</p>
        </div>
      </AppShell>
    );
  }

  if (!stop) {
    return (
      <AppShell bottomNav>
        <div className="px-4 py-6">
          <EmptyState
            icon={TriangleAlert}
            title="Stop not on this manifest"
            body="This stop number isn't part of today's route."
            action={
              <Link to="/manifest">
                <BigButton tone="ghost">Back to manifest</BigButton>
              </Link>
            }
          />
        </div>
      </AppShell>
    );
  }

  async function escalate(option: (typeof OPTIONS)[number]) {
    try {
      await send.mutateAsync({
        title: `Stop ${stopLabel(stop!.seq)} — ${option.title}`,
        body: `${stop!.recipient}, ${stop!.address}. ${option.body}`,
        stopId: stop!.id,
        kind: option.id === "unsafe" ? "alert" : "info",
      });
      setSent(option.id);
      toast.success("Dispatch notified");
    } catch {
      toast.error("Couldn't reach dispatch — try again.");
    }
  }

  return (
    <AppShell bottomNav className="flex flex-col">
      <ScreenHeader
        title="Stop help"
        subtitle={`Stop ${stopLabel(stop.seq)} • ${stop.recipient}`}
        left={
          <Link
            to="/stop/$seq"
            params={{ seq: String(stop.seq) }}
            aria-label="Back to stop"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        }
        right={
          <Pill tone="primary">
            <LifeBuoy className="h-3.5 w-3.5" /> Support
          </Pill>
        }
      />

      <div className="space-y-2 px-4 py-4">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => escalate(option)}
            disabled={send.isPending}
            className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3 text-left disabled:opacity-60"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted-foreground">
              <option.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">{option.title}</span>
              <span className="block truncate text-xs text-muted-foreground">{option.body}</span>
            </span>
            {sent === option.id ? <Pill tone="success">Sent</Pill> : null}
          </button>
        ))}

        <p className="px-1 pt-2 text-xs leading-relaxed text-muted-foreground">
          Dispatch answers in the messages feed. If the stop can't be completed, log a formal
          exception from the delivery screen so the parcel is tracked.
        </p>
      </div>

      <div className="mt-auto space-y-2 border-t border-border/70 bg-background px-4 pt-3 pb-3">
        <BigButton
          tone="ghost"
          onClick={() => navigate({ to: "/notifications" })}
        >
          <Radio className="h-5 w-5" /> Open dispatch messages
        </BigButton>
        <BigButton
          tone="warning"
          onClick={() => navigate({ to: "/nav/$seq", params: { seq: String(stop!.seq) } })}
        >
          <TriangleAlert className="h-5 w-5" /> Log a delivery exception
        </BigButton>
      </div>
    </AppShell>
  );
}
