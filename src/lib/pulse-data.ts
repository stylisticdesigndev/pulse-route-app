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
  eventType: "delivered" | "exception" | "partial";
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

export type Route = Tables<"routes">;
export type StopWithRoute = Stop & { route: Pick<Route, "id" | "code" | "status" | "scheduled_date" | "total_distance_miles" | "estimated_duration_minutes"> | null };

export function stopsQueryKey() {
  return ["stops"] as const;
}

export function useActiveRoute() {
  return useQuery({
    queryKey: ["route", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routes")
        .select("*")
        .in("status", ["active", "assigned"])
        .order("scheduled_date", { ascending: false })
        .limit(1);
      if (error) throw error;
      return (data?.[0] ?? null) as Route | null;
    },
  });
}

export function useStops() {
  return useQuery({
    queryKey: stopsQueryKey(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stops")
        .select(
          "*, route:routes!inner(id, code, status, scheduled_date, total_distance_miles, estimated_duration_minutes)",
        )
        .in("routes.status", ["active", "assigned"])
        .order("sequence_order", { ascending: true, nullsFirst: false })
        .order("seq", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as StopWithRoute[];
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
      status: event.eventType === "exception" ? "exception" : "completed",
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

/* ---------------------------------- driver --------------------------------- */

export type Driver = Tables<"drivers">;
export type DispatchMessage = Tables<"dispatch_messages">;

export const AVATAR_BUCKET = "driver-avatars";

export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function useDriver() {
  return useQuery({
    queryKey: ["driver"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1);
      if (error) throw error;
      return (data?.[0] ?? null) as Driver | null;
    },
  });
}

export function useUpdateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Driver> }) => {
      const { error } = await supabase
        .from("drivers")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["driver"] }),
  });
}

/** Uploads the picked photo to storage and stores its path on the driver row. */
export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ driverId, file }: { driverId: string; file: File }) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${driverId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
      if (error) throw error;
      const { error: rowError } = await supabase
        .from("drivers")
        .update({ avatar_path: path, updated_at: new Date().toISOString() })
        .eq("id", driverId);
      if (rowError) throw rowError;
      return path;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["driver"] });
      qc.invalidateQueries({ queryKey: ["avatar"] });
    },
  });
}

export function useRemoveAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ driverId, path }: { driverId: string; path: string | null }) => {
      if (path) await supabase.storage.from(AVATAR_BUCKET).remove([path]);
      const { error } = await supabase
        .from("drivers")
        .update({ avatar_path: null, updated_at: new Date().toISOString() })
        .eq("id", driverId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["driver"] });
      qc.invalidateQueries({ queryKey: ["avatar"] });
    },
  });
}

/** Resolves a temporary display URL for a stored avatar object path. */
export function useAvatarUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["avatar", path ?? "none"],
    enabled: Boolean(path),
    staleTime: 45 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(AVATAR_BUCKET)
        .createSignedUrl(path as string, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}

/* ------------------------------- dispatch feed ------------------------------ */

export function useMessages() {
  return useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dispatch_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DispatchMessage[];
    },
  });
}

export function useMarkMessagesRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("dispatch_messages")
        .update({ read: true })
        .eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages"] }),
  });
}

/* ---------------------------------- breaks --------------------------------- */

export function useSetBreak() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      shiftId,
      start,
      seconds = 0,
    }: {
      shiftId: string;
      start: boolean;
      seconds?: number;
    }) => {
      const { error } = await supabase
        .from("shifts")
        .update(
          start
            ? { status: "paused", break_started_at: new Date().toISOString() }
            : { status: "active", break_started_at: null, break_seconds: seconds },
        )
        .eq("id", shiftId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shift"] }),
  });
}

/* ------------------------------- shift history ------------------------------ */

export function useShiftHistory() {
  return useQuery({
    queryKey: ["shift-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shifts")
        .select("*")
        .order("started_at", { ascending: false });
      if (error) throw error;
      return data as Shift[];
    },
  });
}

export function useShift(id: string) {
  return useQuery({
    queryKey: ["shift", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("shifts").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Shift;
    },
  });
}

/* --------------------------- parcel-level outcomes -------------------------- */

export function useSetPackageFlags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      packageId,
      patch,
    }: {
      packageId: string;
      patch: { returned?: boolean; delivered?: boolean; scanned?: boolean };
    }) => {
      const { error } = await supabase.from("packages").update(patch).eq("id", packageId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["packages"] }),
  });
}

/** Re-opens a failed stop and pushes it to the back of the route. */
export function useReattemptStop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ stopId, nextSeq }: { stopId: string; nextSeq: number }) => {
      const { error } = await supabase
        .from("stops")
        .update({ status: "pending", completed_at: null, seq: nextSeq })
        .eq("id", stopId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: stopsQueryKey() });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

/* ------------------------------ device geometry ----------------------------- */

export function metersBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}


/** Driver-raised support note that shows up in the dispatch feed. */
export function useSendDispatchNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      body,
      stopId,
      kind = "alert",
    }: {
      title: string;
      body: string;
      stopId?: string | null;
      kind?: string;
    }) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("dispatch_messages").insert({
        title,
        body,
        stop_id: stopId ?? null,
        kind,
        recipient_id: auth.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages"] }),
  });
}
