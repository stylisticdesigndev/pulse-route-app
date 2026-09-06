import { createFileRoute } from "@tanstack/react-router";
import { CheckCheck, CloudOff, RefreshCw, Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell, BigButton, Pill, ScreenHeader } from "@/components/pulse/shell";
import { EmptyState } from "@/components/pulse/states";
import {
  setOfflineMode,
  stopLabel,
  useOfflineMode,
  useQueue,
  useStops,
  useSyncQueue,
} from "@/lib/pulse-data";

const LAST_SYNC_KEY = "pulseroute.lastSync.v1";


export const Route = createFileRoute("/offline")({
  head: () => ({
    meta: [
      { title: "Offline Sync Queue — PulseRoute" },
      {
        name: "description",
        content:
          "Signatures, photos and GPS stamps captured without cellular service are stored locally and synced the moment the network returns.",
      },
      { property: "og:title", content: "Offline Sync Queue — PulseRoute" },
      {
        property: "og:description",
        content: "Review drop-offs queued on the device while offline and push them to dispatch.",
      },
    ],
  }),
  component: OfflineScreen,
});

function OfflineScreen() {
  const offline = useOfflineMode();
  const queue = useQueue();
  const sync = useSyncQueue();
  const { data: stops = [] } = useStops();
  const active = stops.find((s) => s.status === "in_transit");
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    setLastSync(window.localStorage.getItem(LAST_SYNC_KEY));
  }, [queue.length]);


  return (
    <AppShell bottomNav className="flex flex-col">
      <ScreenHeader
        title="Offline Mode"
        subtitle={
          offline
            ? `${queue.length} drop-off${queue.length === 1 ? "" : "s"} queued locally on device`
            : "Network connected — queue drains automatically"
        }
        left={
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${offline ? "bg-warning/20 text-warning" : "bg-success/20 text-success"}`}
          >
            {offline ? <CloudOff className="h-5 w-5" /> : <Wifi className="h-5 w-5" />}
          </span>
        }
        right={<Pill tone={offline ? "warning" : "success"}>{offline ? "Cellular lost" : "Online"}</Pill>}
      />

      <div className="space-y-3 px-4 py-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <p className="truncate text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Local storage sync queue
          </p>
          <span className="text-xs font-bold text-warning">{queue.length} pending sync</span>
        </div>

        {queue.length === 0 ? (
          <EmptyState
            icon={CheckCheck}
            tone="success"
            title="Everything synced"
            body={
              lastSync
                ? `Last synced with dispatch at ${new Date(lastSync).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. Nothing is waiting on the device.`
                : "Nothing is waiting on the device. Completed drop-offs go straight to dispatch."
            }
          />
        ) : (

          <ul className="space-y-2">
            {queue.map((item) => (
              <li
                key={item.localId}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-xs font-black text-muted-foreground">
                  {stopLabel(item.stopSeq)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">{item.recipient}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    •{" "}
                    {item.eventType === "delivered"
                      ? "Signature & GPS stamped"
                      : `Exception: ${item.reason}`}
                  </span>
                </span>
                <Pill tone="warning">
                  <CloudOff className="h-3 w-3" /> Queued
                </Pill>
              </li>
            ))}
          </ul>
        )}

        {active ? (
          <div className="rounded-xl border border-primary bg-primary/10 px-3 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <Pill>Stop {stopLabel(active.seq)}</Pill>
              <span className="truncate text-sm font-bold">{active.recipient}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              All signatures and photos will be stored in the offline cache until network
              reconnection.
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-auto space-y-2 border-t border-border/70 bg-background px-4 pt-3 pb-3">
        <BigButton
          tone={offline ? "ghost" : "success"}
          disabled={offline || queue.length === 0 || sync.isPending}
          onClick={async () => {
            const count = await sync.mutateAsync();
            toast.success(`${count} drop-off${count === 1 ? "" : "s"} synced to dispatch`);
          }}
        >
          <RefreshCw className={`h-5 w-5 ${sync.isPending ? "animate-spin" : ""}`} />
          {offline ? "Syncing Paused until Network Restored" : "Sync Queue Now"}
        </BigButton>
        <button
          onClick={() => {
            setOfflineMode(!offline);
            toast.message(offline ? "Network restored" : "Cellular signal lost — offline mode");
          }}
          className="h-11 w-full rounded-xl border border-border bg-surface-2 text-sm font-bold"
        >
          {offline ? "Simulate network restored" : "Simulate cellular loss"}
        </button>
      </div>
    </AppShell>
  );
}
