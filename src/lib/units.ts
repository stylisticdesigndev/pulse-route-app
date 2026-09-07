import { useEffect, useState } from "react";

export type UnitSystem = "imperial" | "metric";
export type ClockFormat = "12h" | "24h";

const UNITS_KEY = "pulseroute.units.v1";
const CLOCK_KEY = "pulseroute.clock.v1";
const EVENT = "pulseroute:prefs";

/** US standards are the default across the app. */
export const DEFAULT_UNITS: UnitSystem = "imperial";
export const DEFAULT_CLOCK: ClockFormat = "12h";

export function getUnits(): UnitSystem {
  if (typeof window === "undefined") return DEFAULT_UNITS;
  return window.localStorage.getItem(UNITS_KEY) === "metric" ? "metric" : DEFAULT_UNITS;
}

export function getClock(): ClockFormat {
  if (typeof window === "undefined") return DEFAULT_CLOCK;
  return window.localStorage.getItem(CLOCK_KEY) === "24h" ? "24h" : DEFAULT_CLOCK;
}

export function setUnits(value: UnitSystem) {
  window.localStorage.setItem(UNITS_KEY, value);
  window.dispatchEvent(new Event(EVENT));
}

export function setClock(value: ClockFormat) {
  window.localStorage.setItem(CLOCK_KEY, value);
  window.dispatchEvent(new Event(EVENT));
}

const MILES_PER_KM = 0.621371;

function round(value: number) {
  return Math.round(value * 10) / 10;
}

/** Formats a stored kilometre value in the driver's chosen unit system. */
export function formatKm(km: number | null | undefined, units: UnitSystem) {
  if (km === null || km === undefined) return "—";
  return units === "metric" ? `${round(km)} km` : `${round(km * MILES_PER_KM)} mi`;
}

/** Formats a stored mile value in the driver's chosen unit system. */
export function formatMiles(miles: number | null | undefined, units: UnitSystem) {
  if (miles === null || miles === undefined) return "—";
  return units === "metric" ? `${round(miles / MILES_PER_KM)} km` : `${round(miles)} mi`;
}

/** Formats an "HH:MM" clock string for the chosen clock format. */
export function formatClockString(value: string | null | undefined, clock: ClockFormat) {
  if (!value) return "—";
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return value;
  const hours = Number(match[1]);
  const minutes = match[2];
  if (clock === "24h") return `${String(hours).padStart(2, "0")}:${minutes}`;
  const suffix = hours >= 12 ? "PM" : "AM";
  const display = hours % 12 === 0 ? 12 : hours % 12;
  return `${display}:${minutes} ${suffix}`;
}

/** Formats a timestamp (Date or ISO string) for the chosen clock format. */
export function formatTime(value: string | number | Date | null | undefined, clock: ClockFormat) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], {
    hour: clock === "24h" ? "2-digit" : "numeric",
    minute: "2-digit",
    hour12: clock === "12h",
  });
}

/** Global unit + clock preferences, shared across every screen. */
export function useUnitPrefs() {
  const [prefs, setPrefs] = useState<{ units: UnitSystem; clock: ClockFormat }>({
    units: DEFAULT_UNITS,
    clock: DEFAULT_CLOCK,
  });

  useEffect(() => {
    const sync = () => setPrefs({ units: getUnits(), clock: getClock() });
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return {
    ...prefs,
    isMetric: prefs.units === "metric",
    is24h: prefs.clock === "24h",
    km: (value: number | null | undefined) => formatKm(value, prefs.units),
    mi: (value: number | null | undefined) => formatMiles(value, prefs.units),
    clockString: (value: string | null | undefined) => formatClockString(value, prefs.clock),
    time: (value: string | number | Date | null | undefined) => formatTime(value, prefs.clock),
    setUnits,
    setClock,
  };
}
