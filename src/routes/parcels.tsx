import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Package, ScanLine } from "lucide-react";
import { AppShell, Pill, ScreenHeader } from "@/components/pulse/shell";
import { stopLabel, usePackages, useStops } from "@/lib/pulse-data";

export const Route = createFileRoute("/parcels")({
  head: () => ({
    meta: [
      { title: "Parcel Load — PulseRoute" },
      {
        name: "description",
        content:
          "Every parcel on today's manifest with scan status, weight and the stop it belongs to.",
      },
      { property: "og:title", content: "Parcel Load — PulseRoute" },
      {
        property: "og:description",
        content: "Verify the full parcel load for the shift before departure.",
      },
    ],
  }),
  component: Parcels,
});

function Parcels() {
  const { data: stops = [] } = useStops();
  const { data: packages = [] } = usePackages();
  const scanned = packages.filter((p) => p.scanned).length;

  return (
    <AppShell bottomNav>
      <ScreenHeader
        title="Parcel Load"
        subtitle={`${scanned} of ${packages.length} verified on van #408`}
        right={
          <Pill tone={scanned === packages.length ? "success" : "warning"}>
            {scanned === packages.length ? "Load complete" : "Scan pending"}
          </Pill>
        }
      />
      <ul className="space-y-2 px-4 py-4">
        {packages.map((pkg) => {
          const stop = stops.find((s) => s.id === pkg.stop_id);
          return (
            <li key={pkg.id}>
              <Link
                to="/scan/$seq"
                params={{ seq: String(stop?.seq ?? 1) }}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">
                    PKG #{pkg.code} • {pkg.kind}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    Stop {stop ? stopLabel(stop.seq) : "--"} • {stop?.recipient} • {pkg.weight_lbs} lbs
                  </span>
                </span>
                {pkg.scanned ? (
                  <Pill tone="success">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Stowed
                  </Pill>
                ) : (
                  <Pill tone="warning">
                    <ScanLine className="h-3.5 w-3.5" /> Scan
                  </Pill>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
