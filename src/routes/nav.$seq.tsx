import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Camera,
  CheckCircle2,
  CircleAlert,
  MapPin,
  PhoneCall,
  RotateCcw,
  Split,
  TriangleAlert,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MapCanvas } from "@/components/pulse/map-canvas";
import { SignaturePad } from "@/components/pulse/signature-pad";
import { AppShell, BigButton, Pill } from "@/components/pulse/shell";
import {
  stopLabel,
  useOfflineMode,
  useSetStopStatus,
  useStops,
  useSubmitEvent,
  type Stop,
} from "@/lib/pulse-data";

export const Route = createFileRoute("/nav/$seq")({
  head: () => ({
    meta: [
      { title: "Navigation — PulseRoute" },
      {
        name: "description",
        content:
          "Turn-by-turn guidance with live traffic rerouting, arrival capture, proof of service and exception reporting.",
      },
      { property: "og:title", content: "Navigation — PulseRoute" },
      {
        property: "og:description",
        content: "Drive the route, accept dynamic reroutes and capture proof of delivery on arrival.",
      },
    ],
  }),
  component: NavigationScreen,
});

const EXCEPTION_REASONS = [
  "Customer Unavailable / No Response",
  "Security Access Denied / Invalid Gate Code",
  "Damaged Parcel / Refused Delivery",
  "Unsafe Drop Location (Animals / Hazards)",
];

function NavigationScreen() {
  const { seq } = Route.useParams();
  const navigate = useNavigate();
  const { data: stops = [] } = useStops();
  const stop = stops.find((s) => String(s.seq) === seq);
  const offline = useOfflineMode();

  const [sheet, setSheet] = useState<"none" | "pod" | "exception">("none");
  const [traffic, setTraffic] = useState(false);
  const [rerouted, setRerouted] = useState(false);
  const [gpsWeak, setGpsWeak] = useState(false);
  const [confirmFar, setConfirmFar] = useState(false);
  const setStatus = useSetStopStatus();
  const proximity = gpsWeak ? 184 : 12;

  async function beginProof() {
    if (!stop) return;
    await setStatus.mutateAsync({ stopId: stop.id, status: "in_transit" });
    setConfirmFar(false);
    setSheet("pod");
  }


  if (!stop) {
    return (
      <AppShell>
        <p className="safe-top px-4 py-6 text-sm text-muted-foreground">Loading route…</p>
      </AppShell>
    );
  }

  return (
    <AppShell className="flex flex-col">
      <div className="relative flex-1">
        <MapCanvas variant={traffic ? "reroute" : "turn"} className="absolute inset-0" />

        {traffic ? (
          <div className="safe-top absolute inset-x-3 top-0">
            <div className="flex items-center gap-3 rounded-xl border border-destructive/60 bg-card/95 px-3 py-2.5 backdrop-blur">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/20">
                <CircleAlert className="h-5 w-5 text-destructive" />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-bold uppercase tracking-widest text-destructive">
                  Traffic bottleneck detected
                </span>
                <span className="block truncate text-sm font-bold">
                  Heavy Delay on I-80 East (+18 min)
                </span>
              </span>
            </div>
          </div>
        ) : (
          <div className="safe-top absolute inset-x-3 top-0">
            <div className="flex items-center gap-3 rounded-xl bg-card/95 px-3 py-2.5 backdrop-blur">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success text-success-foreground">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 20V11a4 4 0 0 1 4-4h8" />
                  <path d="m14 3 4 4-4 4" />
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block truncate text-lg font-bold">In 500 ft, Turn Right</span>
                <span className="block truncate text-xs text-muted-foreground">
                  onto {stop.address.replace(/^\d+\s/, "")}
                </span>
                <span className="block text-xs font-bold text-success">
                  ETA {stop.eta} • {stop.distance_km} km
                </span>
              </span>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            setTraffic((t) => !t);
            setRerouted(false);
          }}
          className="absolute right-3 bottom-3 flex h-11 items-center gap-2 rounded-full border border-border bg-card/95 px-4 text-xs font-bold backdrop-blur"
        >
          <TriangleAlert className="h-4 w-4 text-warning" />
          {traffic ? "Clear traffic alert" : "Simulate traffic"}
        </button>
      </div>

      {traffic ? (
        <div className="safe-bottom shrink-0 space-y-3 border-t border-border bg-background px-4 pt-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Dynamic reroute recommended
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-border bg-surface p-3">
              <p className="text-xs text-muted-foreground">Current Route</p>
              <p className="text-xl font-bold text-destructive">28 min</p>
              <p className="text-[11px] text-destructive">Heavy congestion</p>
            </div>
            <div className="rounded-xl border border-success/50 bg-success/10 p-3">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1">
                <p className="truncate text-xs text-success">Via Oakridge</p>
                <Pill tone="success" className="px-1.5 py-0.5">
                  -14 min
                </Pill>
              </div>
              <p className="text-xl font-bold">14 min</p>
              <p className="text-[11px] text-success">Fastest path available</p>
            </div>
          </div>
          <BigButton
            tone="warning"
            disabled={rerouted}
            onClick={() => {
              setRerouted(true);
              setTraffic(false);
              toast.success("Reroute accepted • Dispatch notified");
            }}
          >
            <Split className="h-5 w-5" />
            {rerouted ? "Reroute Accepted" : "Accept Dynamic Reroute & Notify Dispatch"}
          </BigButton>
        </div>
      ) : (
        <div className="safe-bottom shrink-0 space-y-3 border-t border-border bg-background px-4 pt-3">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-bold">
                {stop.recipient} • Stop {stopLabel(stop.seq)}
              </p>
              <p className="truncate text-xs text-muted-foreground">{stop.address}</p>
            </div>
            <a
              href={`tel:${(stop.phone ?? "").replace(/\s/g, "")}`}
              className="flex h-11 items-center gap-2 rounded-full border border-border bg-surface-2 px-4 text-sm font-bold"
            >
              <PhoneCall className="h-4 w-4" /> Call
            </a>
          </div>
          <BigButton
            tone="warning"
            onClick={async () => {
              await setStatus.mutateAsync({ stopId: stop.id, status: "in_transit" });
              setSheet("pod");
            }}
          >
            <MapPin className="h-5 w-5" /> Arrived at Stop
          </BigButton>
          <button
            onClick={() => setSheet("exception")}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-destructive/50 bg-destructive/10 text-sm font-bold text-destructive"
          >
            <CircleAlert className="h-4 w-4" /> Report Exception
          </button>
        </div>
      )}

      {sheet === "pod" ? (
        <ProofSheet stop={stop} offline={offline} onClose={() => setSheet("none")} onDone={() => navigate({ to: "/manifest" })} />
      ) : null}
      {sheet === "exception" ? (
        <ExceptionSheet stop={stop} offline={offline} onClose={() => setSheet("none")} onDone={() => navigate({ to: "/manifest" })} />
      ) : null}
    </AppShell>
  );
}

function SheetFrame({
  children,
  title,
  subtitle,
  icon,
  onClose,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="safe-top grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 pb-3">
        <div className="flex min-w-0 items-center gap-3">
          {icon}
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold">{title}</h2>
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-6">{children}</div>
    </div>
  );
}

function ProofSheet({
  stop,
  offline,
  onClose,
  onDone,
}: {
  stop: Stop;
  offline: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [photo, setPhoto] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const submit = useSubmitEvent();

  async function complete() {
    const result = await submit.mutateAsync({
      stopId: stop.id,
      stopSeq: stop.seq,
      recipient: stop.recipient,
      eventType: "delivered",
      reason: null,
      signature_path: signature,
      photo_captured: photo,
      proximity_m: 12,
      gps: "37.7749,-122.4194",
    });
    toast.success(
      result.queued ? "Drop-off queued offline — will sync on reconnect" : "Drop-off synced to dispatch",
    );
    onDone();
  }

  return (
    <SheetFrame title="Proof of Service" subtitle={`Stop ${stopLabel(stop.seq)} • ${stop.recipient}`} onClose={onClose}>
      <button
        onClick={() => setPhoto(true)}
        className="w-full rounded-2xl border border-border bg-surface px-4 py-8 text-center"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
          <Camera className="h-7 w-7 text-primary" />
        </span>
        <span className="mt-3 block text-sm font-bold">
          {photo ? "Parcel photo captured" : "Tap to Capture Parcel Photo"}
        </span>
        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-[11px] font-bold text-success">
          <CheckCircle2 className="h-3.5 w-3.5" /> Proximity Verified: 12m away
        </span>
      </button>

      <div className="mt-3">
        <SignaturePad onChange={setSignature} />
      </div>

      <div className="mt-4">
        <BigButton tone="success" disabled={!signature || !photo || submit.isPending} onClick={complete}>
          <CheckCircle2 className="h-5 w-5" />
          {offline ? "Complete & Queue Drop-Off" : "Complete & Sync Drop-Off"}
        </BigButton>
        {!signature || !photo ? (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Capture a parcel photo and recipient signature to complete.
          </p>
        ) : null}
      </div>
    </SheetFrame>
  );
}

function ExceptionSheet({
  stop,
  offline,
  onClose,
  onDone,
}: {
  stop: Stop;
  offline: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState(EXCEPTION_REASONS[0]!);
  const [photo, setPhoto] = useState(false);
  const submit = useSubmitEvent();

  async function log() {
    const result = await submit.mutateAsync({
      stopId: stop.id,
      stopSeq: stop.seq,
      recipient: stop.recipient,
      eventType: "exception",
      reason,
      signature_path: null,
      photo_captured: photo,
      proximity_m: 12,
      gps: "37.7749,-122.4194",
    });
    toast.error(
      result.queued
        ? "Exception queued offline — dispatch notified on reconnect"
        : "Failure logged • Stop rescheduled by dispatch",
    );
    onDone();
  }

  return (
    <SheetFrame
      title="Report Exception"
      subtitle={`Stop ${stopLabel(stop.seq)} • ${stop.recipient}`}
      icon={
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive text-destructive-foreground">
          <CircleAlert className="h-5 w-5" />
        </span>
      }
      onClose={onClose}
    >
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        Select primary reason for non-delivery
      </p>
      <ul className="mt-2 space-y-2">
        {EXCEPTION_REASONS.map((option) => {
          const active = option === reason;
          return (
            <li key={option}>
              <button
                onClick={() => setReason(option)}
                className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-3 py-3 text-left ${
                  active
                    ? "border-destructive bg-destructive/10"
                    : "border-border bg-surface"
                }`}
              >
                <span
                  className={`h-3.5 w-3.5 shrink-0 rounded-full ${active ? "bg-destructive" : "bg-muted-foreground/40"}`}
                />
                <span className={`truncate text-sm ${active ? "font-bold" : "text-muted-foreground"}`}>
                  {option}
                </span>
                {active ? <CheckCircle2 className="h-4 w-4 shrink-0 text-destructive" /> : <span />}
              </button>
            </li>
          );
        })}
      </ul>

      <button
        onClick={() => setPhoto(true)}
        className="mt-3 w-full rounded-2xl border border-border bg-surface px-4 py-6 text-center"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20">
          <Camera className="h-6 w-6 text-destructive" />
        </span>
        <span className="mt-2 block text-sm font-bold">
          {photo ? "Doorstep attempt photo captured" : "Tap to capture doorstep attempt photo"}
        </span>
        <span className="block text-xs text-muted-foreground">
          Required for automated dispatch waiver approval
        </span>
      </button>

      <div className="mt-4">
        <BigButton
          tone="destructive"
          disabled={!photo || submit.isPending}
          onClick={log}
          className="border-destructive bg-destructive text-destructive-foreground"
        >
          <RotateCcw className="h-5 w-5" />
          {offline ? "Queue Failure & Reschedule" : "Log Failure & Reschedule"}
        </BigButton>
        <Link to="/manifest" className="mt-3 block text-center text-xs text-muted-foreground underline">
          Back to manifest
        </Link>
      </div>
    </SheetFrame>
  );
}
