import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, CornerUpLeft, Package, PackageOpen, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { AppShell, BigButton, Pill, ScreenHeader } from "@/components/pulse/shell";
import { EmptyState, ErrorState, OffShiftState } from "@/components/pulse/states";
import {
  stopLabel,
  useActiveShift,
  usePackages,
  useSetPackageFlags,
  useStops,
} from "@/lib/pulse-data";

export const Route = createFileRoute("/parcels")({
  head: () => ({
    meta: [
      { title: "Parcel Load — PulseRoute" },
      {
        name: "description",
        content:
          "Every parcel on today's manifest with scan status, weight, return-to-depot flag and the stop it belongs to.",
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
  const {
    data: packages = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = usePackages();
  const { data: shift, isLoading: shiftLoading } = useActiveShift();
  const setFlags = useSetPackageFlags();
  const scanned = packages.filter((p) => p.scanned).length;
  const returns = packages.filter((p) => p.returned).length;

  if (!shiftLoading && !shift) {
    return (
      <AppShell bottomNav>
        <OffShiftState />
      </AppShell>
    );
  }

  return (
    <AppShell bottomNav>
      <ScreenHeader
        title="Parcel Load"
        subtitle={`${scanned} of ${packages.length} verified on van #408${returns ? ` • ${returns} returning` : ""}`}
        right={
          <Pill tone={packages.length && scanned === packages.length ? "success" : "warning"}>
            {packages.length && scanned === packages.length ? "Load complete" : "Scan pending"}
          </Pill>
        }
      />
      <div className="space-y-2 px-4 py-4">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading parcels…</p>
        ) : null}

        {isError ? (
          <ErrorState
            title="Parcel load didn't open"
            body="The manifest couldn't be read. Nothing about your scans was lost."
            onRetry={() => refetch()}
            retrying={isFetching}
          />
        ) : null}

        {!isLoading && !isError && packages.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title="Nothing loaded yet"
            body="Scan parcels into the van and they'll appear here against their stop."
            action={
              <Link to="/scan/$seq" params={{ seq: "1" }}>
                <BigButton>
                  <ScanLine className="h-5 w-5" /> Open scanner
                </BigButton>
              </Link>
            }
          />
        ) : null}

        <ul className="space-y-2">
          {packages.map((pkg) => {
            const stop = stops.find((s) => s.id === pkg.stop_id);
            return (
              <li
                key={pkg.id}
                className="rounded-xl border border-border bg-surface px-3 py-3"
              >
                <Link
                  to="/scan/$seq"
                  params={{ seq: String(stop?.seq ?? 1) }}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3"
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
                  {pkg.returned ? (
                    <Pill tone="destructive">
                      <CornerUpLeft className="h-3.5 w-3.5" /> Return
                    </Pill>
                  ) : pkg.delivered ? (
                    <Pill tone="success">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Delivered
                    </Pill>
                  ) : pkg.scanned ? (
                    <Pill tone="success">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Stowed
                    </Pill>
                  ) : (
                    <Pill tone="warning">
                      <ScanLine className="h-3.5 w-3.5" /> Scan
                    </Pill>
                  )}
                </Link>
                {!pkg.delivered ? (
                  <button
                    onClick={() => {
                      setFlags.mutate({
                        packageId: pkg.id,
                        patch: { returned: !pkg.returned },
                      });
                      toast.message(
                        pkg.returned
                          ? `PKG #${pkg.code} back on the route`
                          : `PKG #${pkg.code} flagged return to depot`,
                      );
                    }}
                    className={`mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg border text-xs font-bold ${
                      pkg.returned
                        ? "border-border bg-surface-2 text-muted-foreground"
                        : "border-destructive/40 bg-destructive/10 text-destructive"
                    }`}
                  >
                    <CornerUpLeft className="h-4 w-4" />
                    {pkg.returned ? "Cancel return to depot" : "Return to depot"}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </AppShell>
  );
}
