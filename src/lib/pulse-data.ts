import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Stop = Tables<"stops">;
export type Package = Tables<"packages">;
export type Shift = Tables<"shifts">;

export const MANIFEST_CODE = "RT-8842";
export const DRIVER = {
  name: "Marcus Vance",
  code: "#9924",
  vehicle: "Van #408 - Ford Transit",
  company: "Apex Move Logistics",
};

export type QueuedEvent = {
  localId: string;
  stopSeq: number;
  stopId: string;
  recipient: string;
  eventType: "delivered" | "exception";
  reason: string | null;
  signature_path: string | null;
  photo_captured: boolean;
  proximity_m: number | null;
  gps: string | null;
  createdAt: string;
};

const QUEUE_KEY = "pulseroute.queue.v1";
const OFFLINE_KEY = "pulseroute.offline.v1";

function readQueue(): QueuedEvent[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(QUEUE_KEY) ?? "[]") as QueuedEvent[];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedEvent[]) {
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("pulseroute:queue"));
}

export function isOfflineMode() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(OFFLINE_KEY) === "1";
}

export function setOfflineMode(value: boolean) {
  window.localStorage.setItem(OFFLINE_KEY, value ? "1" : "0");
  window.dispatchEvent(new Event("pulseroute:offline"));
}

export function useOfflineMode() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const sync = () => setOffline(isOfflineMode() || !navigator.onLine);
    sync();
    window.addEventListener("pulseroute:offline", sync);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("pulseroute:offline", sync);
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);
  return offline;
}

export function useQueue() {
  const [queue, setQueue] = useState<QueuedEvent[]>([]);
  useEffect(() => {
    const sync = () => setQueue(readQueue());
    sync();
    window.addEventListener("pulseroute:queue", sync);
    return () => window.removeEventListener("pulseroute:queue", sync);
  }, []);
  return queue;
}

export function stopsQueryKey() {
  return ["stops"] as const;
}

export function useStops() {
  return useQuery({
    queryKey: stopsQueryKey(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stops")
        .select("*")
        .order("seq", { ascending: true });
      if (error) throw error;
      return data as Stop[];
    },
  });
}

export function usePackages(stopId?: string) {
  return useQuery({
    queryKey: ["packages", stopId ?? "all"],
    queryFn: async () => {
      const query = supabase.from("packages").select("*").order("code");
      const { data, error } = stopId ? await query.eq("stop_id", stopId) : await query;
      if (error) throw error;
      return data as Package[];
    },
  });
}

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_events")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useActiveShift() {
  return useQuery({
    queryKey: ["shift"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shifts")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return (data?.[0] ?? null) as Shift | null;
    },
  });
}

export function useStartShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (odometer: number) => {
      const { data, error } = await supabase
        .from("shifts")
        .insert({
          driver_name: DRIVER.name,
          driver_code: DRIVER.code,
          manifest_code: MANIFEST_CODE,
          vehicle: DRIVER.vehicle,
          odometer_start: odometer,
          status: "active",
        })
        .select()
        .single();
      if (error) throw error;
      return data as Shift;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shift"] }),
  });
}

export function useEndShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (shiftId: string) => {
      const { error } = await supabase
        .from("shifts")
        .update({ status: "complete", ended_at: new Date().toISOString() })
        .eq("id", shiftId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shift"] }),
  });
}

export function useScanPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (packageId: string) => {
      const { error } = await supabase
        .from("packages")
        .update({ scanned: true })
        .eq("id", packageId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["packages"] }),
  });
}

export function useSetStopStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ stopId, status }: { stopId: string; status: string }) => {
      const { error } = await supabase.from("stops").update({ status }).eq("id", stopId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: stopsQueryKey() }),
  });
}

type SubmitInput = Omit<QueuedEvent, "localId" | "createdAt">;

async function pushEvent(event: SubmitInput, shiftId: string | null) {
  const { error } = await supabase.from("delivery_events").insert({
    stop_id: event.stopId,
    shift_id: shiftId,
    event_type: event.eventType,
    reason: event.reason,
    signature_path: event.signature_path,
    photo_captured: event.photo_captured,
    proximity_m: event.proximity_m,
    gps: event.gps,
  });
  if (error) throw error;
  const { error: stopError } = await supabase
    .from("stops")
    .update({
      status: event.eventType === "delivered" ? "completed" : "exception",
      completed_at: new Date().toISOString(),
    })
    .eq("id", event.stopId);
  if (stopError) throw stopError;
}

/** Submits proof of service or an exception, queueing locally when offline. */
export function useSubmitEvent() {
  const qc = useQueryClient();
  const { data: shift } = useActiveShift();
  return useMutation({
    mutationFn: async (event: SubmitInput) => {
      if (isOfflineMode() || !navigator.onLine) {
        writeQueue([
          ...readQueue(),
          { ...event, localId: crypto.randomUUID(), createdAt: new Date().toISOString() },
        ]);
        return { queued: true } as const;
      }
      await pushEvent(event, shift?.id ?? null);
      return { queued: false } as const;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: stopsQueryKey() });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useSyncQueue() {
  const qc = useQueryClient();
  const { data: shift } = useActiveShift();
  return useMutation({
    mutationFn: async () => {
      const items = readQueue();
      for (const item of items) {
        await pushEvent(item, shift?.id ?? null);
      }
      writeQueue([]);
      return items.length;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: stopsQueryKey() });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function stopLabel(seq: number) {
  return String(seq).padStart(2, "0");
}
