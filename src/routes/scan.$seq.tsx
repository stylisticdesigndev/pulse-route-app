import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  Flashlight,
  HelpCircle,
  Keyboard,
  LifeBuoy,
  Package,
  TriangleAlert,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell, BigButton, Pill } from "@/components/pulse/shell";
import { PermissionGate } from "@/components/pulse/states";
import { stopLabel, usePackages, useScanPackage, useStops } from "@/lib/pulse-data";

export const Route = createFileRoute("/scan/$seq")({
  head: () => ({
    meta: [
      { title: "Parcel Scanner — PulseRoute" },
      {
        name: "description",
        content:
          "Scan or manually key parcel barcodes to verify every item is stowed before departing for the stop.",
      },
      { property: "og:title", content: "Parcel Scanner — PulseRoute" },
      {
        property: "og:description",
        content: "Barcode verification for PulseRoute parcels, with manual entry fallback.",
      },
    ],
  }),
  component: Scanner,
});

function Scanner() {
  const { seq } = Route.useParams();
  const navigate = useNavigate();
  const { data: stops = [] } = useStops();
  const stop = stops.find((s) => String(s.seq) === seq);
  const { data: packages = [] } = usePackages(stop?.id);
  const scan = useScanPackage();
  const [torch, setTorch] = useState(false);
  const [manual, setManual] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);
  const [cameraDenied, setCameraDenied] = useState(false);

  const next = packages.find((p) => !p.scanned);
  const scanned = packages.filter((p) => p.scanned).length;
  const focus = next ?? packages[packages.length - 1];

  useEffect(() => {
    let cancelled = false;
    async function probe() {
      const perms = (navigator as Navigator & { permissions?: Permissions }).permissions;
      if (!perms?.query) return;
      try {
        const status = await perms.query({ name: "camera" as PermissionName });
        if (!cancelled) setCameraDenied(status.state === "denied");
      } catch {
        /* permission name unsupported — treat as available */
      }
    }
    void probe();
    return () => {
      cancelled = true;
    };
  }, []);

  async function confirm(code?: string) {
    const target = code
      ? packages.find((p) => p.code.toLowerCase() === code.trim().toLowerCase())
      : next;
    if (!target) {
      setRejected(code?.trim() || "unreadable");
      return;
    }
    setRejected(null);
    await scan.mutateAsync(target.id);
    toast.success(`PKG #${target.code} stowed`);
    setManual("");
    setShowManual(false);
  }


  return (
    <AppShell className="flex flex-col">
      <div className="relative flex-1 bg-black">
        <div className="safe-top absolute inset-x-3 top-0 z-10 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
          <button
            onClick={() => navigate({ to: "/stop/$seq", params: { seq } })}
            aria-label="Close scanner"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2/90"
          >
            <X className="h-5 w-5" />
          </button>
          <span />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTorch((t) => !t)}
              aria-label="Toggle torch"
              className={`flex h-10 w-10 items-center justify-center rounded-full ${torch ? "bg-primary text-primary-foreground" : "bg-surface-2/90"}`}
            >
              <Flashlight className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                const code = window.prompt("Enter parcel barcode");
                if (code) void confirm(code);
              }}
              className="flex h-10 items-center gap-1.5 rounded-full bg-surface-2/90 px-3 text-xs font-bold"
            >
              <Keyboard className="h-4 w-4" /> Manual Entry
            </button>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative h-56 w-64">
            <span className="absolute left-0 top-0 h-8 w-8 border-l-4 border-t-4 border-primary" />
            <span className="absolute right-0 top-0 h-8 w-8 border-r-4 border-t-4 border-primary" />
            <span className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-primary" />
            <span className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-primary" />
            <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-md bg-white px-3 py-3 text-center">
              <p className="text-[8px] font-bold tracking-[0.2em] text-black">
                APEX EXPRESS LOGISTICS
              </p>
              <div className="mx-auto mt-1 flex h-10 items-end justify-center gap-[2px]">
                {Array.from({ length: 34 }).map((_, i) => (
                  <span
                    key={i}
                    className="bg-black"
                    style={{ width: i % 3 === 0 ? 3 : 1.5, height: "100%" }}
                  />
                ))}
              </div>
              <p className="mt-1 text-[9px] font-bold tracking-[0.2em] text-black">
                * {focus?.code ?? "RT-8842"} *
              </p>
            </div>
            <div className="animate-scanline absolute inset-x-0 top-1/2 h-[3px] rounded-full bg-success shadow-[0_0_16px_var(--success)]" />
          </div>
        </div>

        <p className="absolute inset-x-0 bottom-4 mx-auto flex w-fit items-center gap-1.5 rounded-full bg-surface-2/90 px-3 py-1.5 text-xs text-muted-foreground">
          <HelpCircle className="h-3.5 w-3.5 text-primary" /> Align barcode within reticle frame
        </p>
      </div>

      <div className="safe-bottom shrink-0 space-y-3 border-t border-border bg-background px-4 pt-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <Pill tone="primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {scanned} of {packages.length} packages scanned
          </Pill>
          <span className="truncate text-xs text-muted-foreground">
            Stop {stop ? stopLabel(stop.seq) : "--"} • {stop?.recipient.split(" ").slice(-1)[0]}
          </span>
        </div>

        {focus ? (
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-success/40 bg-surface px-3 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/15">
              <Package className="h-5 w-5 text-success" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">PKG #{focus.code}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {focus.description} • {focus.weight_lbs} lbs
              </span>
            </span>
            <Check className={`h-5 w-5 ${focus.scanned ? "text-success" : "text-muted-foreground/40"}`} />
          </div>
        ) : null}

        {next ? (
          <BigButton tone="success" disabled={scan.isPending} onClick={() => confirm()}>
            <Check className="h-5 w-5" /> Confirm Package Stowed
          </BigButton>
        ) : (
          <BigButton onClick={() => navigate({ to: "/nav/$seq", params: { seq } })}>
            <Check className="h-5 w-5" /> All parcels stowed — Navigate
          </BigButton>
        )}
        <p className="sr-only">{manual}</p>
      </div>
    </AppShell>
  );
}
