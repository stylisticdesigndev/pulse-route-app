import type { Tables } from "@/integrations/supabase/types";

type DemoStop = Tables<"stops"> & {
  route: Pick<
    Tables<"routes">,
    "id" | "code" | "status" | "scheduled_date" | "total_distance_miles" | "estimated_duration_minutes"
  > | null;
};

const ROUTE = {
  id: "demo-route-rt-8842",
  code: "RT-8842",
  status: "active",
  scheduled_date: new Date().toISOString().slice(0, 10),
  total_distance_miles: 46,
  estimated_duration_minutes: 320,
};

type DemoStopSeed = {
  seq: number;
  recipient: string;
  address: string;
  city: string;
  zip: string;
  window: [string, string];
  eta: string;
  km: number;
  status: string;
  sector: string;
  phone: string;
  notes: string;
};

const SEEDS: DemoStopSeed[] = [
  {
    seq: 1,
    recipient: "Harper Lin",
    address: "1420 Meridian St, Unit 3B",
    city: "Indianapolis",
    zip: "46202",
    window: ["08:30", "10:00"],
    eta: "09:12",
    km: 3.4,
    status: "completed",
    sector: "Sector A",
    phone: "(317) 555-0142",
    notes: "Left with front desk, signature captured.",
  },
  {
    seq: 2,
    recipient: "Delgado Freight Co.",
    address: "88 Rockville Rd, Dock 4",
    city: "Indianapolis",
    zip: "46214",
    window: ["09:00", "11:30"],
    eta: "10:24",
    km: 6.1,
    status: "in_transit",
    sector: "Sector B",
    phone: "(317) 555-0188",
    notes: "Pallet cargo — dock check-in required.",
  },
  {
    seq: 3,
    recipient: "Nina Okafor",
    address: "2207 Broad Ripple Ave",
    city: "Indianapolis",
    zip: "46220",
    window: ["11:00", "13:00"],
    eta: "11:48",
    km: 9.7,
    status: "pending",
    sector: "Sector B",
    phone: "(317) 555-0219",
    notes: "Gate code 4471 • leave at side porch if no answer.",
  },
  {
    seq: 4,
    recipient: "Apex Dental Group",
    address: "5510 E 82nd St, Suite 210",
    city: "Indianapolis",
    zip: "46250",
    window: ["12:30", "14:30"],
    eta: "13:05",
    km: 14.2,
    status: "pending",
    sector: "Sector C",
    phone: "(317) 555-0267",
    notes: "Fragile crate — signature required on delivery.",
  },
  {
    seq: 5,
    recipient: "Terrence Boyd",
    address: "704 Sycamore Ln",
    city: "Carmel",
    zip: "46032",
    window: ["14:00", "16:00"],
    eta: "14:52",
    km: 19.6,
    status: "pending",
    sector: "Sector C",
    phone: "(317) 555-0301",
    notes: "Recipient requested doorstep photo proof.",
  },
];

export const DEMO_STOPS: DemoStop[] = SEEDS.map((seed) => ({
  id: `demo-stop-${seed.seq}`,
  access_notes: seed.notes,
  address: seed.address,
  address_line1: seed.address,
  city: seed.city,
  completed_at: seed.status === "completed" ? new Date().toISOString() : null,
  created_at: new Date().toISOString(),
  delivery_window_end: seed.window[1],
  delivery_window_start: seed.window[0],
  distance_km: seed.km,
  drop_instruction: seed.notes,
  eta: seed.eta,
  gate_code: seed.seq === 3 ? "4471" : null,
  hazard_warning: null,
  latitude: 39.77 + seed.seq * 0.012,
  longitude: -86.16 - seed.seq * 0.009,
  phone: seed.phone,
  recipient: seed.recipient,
  recipient_name: seed.recipient,
  route_id: ROUTE.id,
  sector: seed.sector,
  seq: seed.seq,
  sequence_order: seed.seq,
  state: "IN",
  status: seed.status,
  window_end: seed.window[1],
  window_start: seed.window[0],
  zip_code: seed.zip,
  route: ROUTE,
})) as unknown as DemoStop[];

export const DEMO_SHIFT = {
  id: "demo-shift-rt-8842",
  break_seconds: 0,
  break_started_at: null,
  driver_code: "#9924",
  driver_name: "Marcus Vance",
  driver_user_id: null,
  ended_at: null,
  manifest_code: "RT-8842",
  odometer_end: null,
  odometer_start: 84210,
  started_at: new Date().toISOString(),
  status: "active",
  vehicle: "Van #408 - Ford Transit",
} as unknown as Tables<"shifts">;

export const DEMO_PACKAGES = DEMO_STOPS.flatMap((stop, index) => [
  {
    id: `demo-pkg-${stop.seq}-a`,
    code: `APX-88${stop.seq}1`,
    delivered: stop.status === "completed",
    description: index % 2 === 0 ? "Document envelope" : "Sealed carton",
    kind: index % 2 === 0 ? "envelope" : "box",
    returned: false,
    scanned: stop.status !== "pending",
    stop_id: stop.id,
    weight_lbs: 4 + index,
  },
  {
    id: `demo-pkg-${stop.seq}-b`,
    code: `APX-88${stop.seq}2`,
    delivered: stop.status === "completed",
    description: "Palletized cargo",
    kind: "pallet",
    returned: false,
    scanned: stop.status === "completed",
    stop_id: stop.id,
    weight_lbs: 22 + index * 3,
  },
]) as unknown as Tables<"packages">[];

/* ------------------- local mutations for the demo session ------------------- */

export const demoState = { shift: { ...DEMO_SHIFT } as Tables<"shifts">, shiftOpen: true };

export function demoPatchShift(patch: Partial<Tables<"shifts">>) {
  demoState.shift = { ...demoState.shift, ...patch };
}

export function demoPatchStop(stopId: string, patch: Partial<Tables<"stops">>) {
  const stop = DEMO_STOPS.find((item) => item.id === stopId);
  if (stop) Object.assign(stop, patch);
}

export function demoPatchPackage(packageId: string, patch: Partial<Tables<"packages">>) {
  const pkg = DEMO_PACKAGES.find((item) => item.id === packageId);
  if (pkg) Object.assign(pkg, patch);
}

/** Portfolio showcase: dispatch reassigns a priority parcel onto Marcus Vance's manifest. */
export function demoInjectPriorityStop() {
  const id = "demo-stop-priority-apx-9001";
  if (DEMO_STOPS.some((s) => s.id === id)) return;
  const base = DEMO_STOPS[0] as unknown as Record<string, unknown>;
  const seq = Math.max(...DEMO_STOPS.map((s) => s.seq ?? 0)) + 1;
  DEMO_STOPS.push({
    ...(base as object),
    id,
    seq,
    sequence_order: seq,
    status: "pending",
    completed_at: null,
    recipient: "Odette Marchand",
    recipient_name: "Odette Marchand",
    address: "88 Wabash Ave, Suite 1200",
    address_line1: "88 Wabash Ave, Suite 1200",
    city: "Indianapolis",
    zip_code: "46204",
    sector: "Midtown Loop",
    window_start: "15:00",
    window_end: "16:30",
    delivery_notes: "Priority reassignment from Route 4 — signature required.",
    gate_code: null,
  } as unknown as (typeof DEMO_STOPS)[number]);
  DEMO_PACKAGES.push({
    id: "demo-pkg-priority-9001",
    code: "APX-9001",
    delivered: false,
    description: "Priority medical carton",
    kind: "box",
    returned: false,
    scanned: false,
    stop_id: id,
    weight_lbs: 9,
  } as unknown as (typeof DEMO_PACKAGES)[number]);
}

export function demoHasPriorityStop() {
  return DEMO_STOPS.some((s) => s.id === "demo-stop-priority-apx-9001");
}
