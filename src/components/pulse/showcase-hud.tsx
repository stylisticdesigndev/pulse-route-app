import {
  ChevronLeft,
  ChevronRight,
  Gauge,
  HardHat,
  Info,
  Pause,
  Play,
  RadioTower,
  X,
} from "lucide-react";
import { useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useShowcase } from "@/lib/showcase-context";
import { ALL_STEPS } from "@/lib/showcase-context";

/** Floating tour toolbar + product & architecture explainer card. */
export function ShowcaseHud() {
  const {
    active,
    playing,
    speed,
    index,
    step,
    start,
    exit,
    play,
    pause,
    next,
    prev,
    cycleSpeed,
    goToRole,
  } = useShowcase();
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname === "/auth") return null;

  if (!active) {
    return (
      <button
        onClick={() => start()}
        className="fixed left-3 z-50 flex h-9 items-center gap-1.5 rounded-full border border-border bg-card/95 px-3 text-xs font-semibold text-foreground shadow-lg backdrop-blur"
        style={{ top: "max(2.75rem, calc(env(safe-area-inset-top) + 0.5rem))" }}
      >
        <Play className="h-4 w-4 text-primary" strokeWidth={2.6} /> Showcase
      </button>
    );
  }

  const tech = step?.role === "field_technician";

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-50"
      style={{ top: "max(2.5rem, calc(env(safe-area-inset-top) + 0.25rem))" }}
    >
      <div className="pointer-events-auto mx-3 rounded-2xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur">
        <div className="grid grid-cols-2 gap-1.5">
          <RoleTab
            active={tech}
            icon={HardHat}
            label="Courier View"
            sub="Marcus Vance"
            onClick={() => goToRole("field_technician")}
          />
          <RoleTab
            active={!tech}
            icon={RadioTower}
            label="Dispatch View"
            sub="Operations Control"
            onClick={() => goToRole("dispatch_supervisor")}
          />
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          <Ctl onClick={prev} label="Previous step">
            <ChevronLeft className="h-4 w-4" />
          </Ctl>
          <Ctl onClick={playing ? pause : play} label={playing ? "Pause tour" : "Play tour"} primary>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Ctl>
          <Ctl onClick={next} label="Next step">
            <ChevronRight className="h-4 w-4" />
          </Ctl>
          <button
            onClick={cycleSpeed}
            aria-label="Playback speed"
            className="flex h-9 items-center gap-1 rounded-full border border-border bg-surface-2 px-3 text-xs font-bold text-foreground"
          >
            <Gauge className="h-3.5 w-3.5" /> {speed}x
          </button>
          <span className="ml-auto text-[11px] font-bold text-muted-foreground">
            {index + 1}/{ALL_STEPS.length}
          </span>
          <button
            onClick={exit}
            aria-label="Exit showcase"
            className="flex h-9 items-center gap-1 rounded-full border border-destructive/50 bg-destructive/15 px-3 text-[11px] font-bold uppercase tracking-wide text-destructive"
          >
            <X className="h-3.5 w-3.5" /> Exit
          </button>
        </div>

        {step ? (
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="mt-2 grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-left"
          >
            <Info className="h-4 w-4 shrink-0 text-primary" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">{step.screen}</span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {step.roleContext}
              </span>
            </span>
            <ChevronRight
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                collapsed ? "" : "rotate-90",
              )}
            />
          </button>
        ) : null}

        {step && !collapsed ? (
          <div className="mt-2 space-y-2">
            <Block label="User experience intent" body={step.intent} />
            <Block label="Technical architecture" body={step.architecture} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RoleTab({
  active,
  icon: Icon,
  label,
  sub,
  onClick,
}: {
  active: boolean;
  icon: typeof HardHat;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-xl border px-2.5 py-2 text-left",
        active ? "border-primary/60 bg-primary/15" : "border-border bg-surface-2",
      )}
    >
      <Icon
        className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")}
        strokeWidth={2.4}
      />
      <span className="min-w-0">
        <span className="block truncate text-[11px] font-bold">{label}</span>
        <span className="block truncate text-[10px] text-muted-foreground">{sub}</span>
      </span>
    </button>
  );
}

function Ctl({
  children,
  onClick,
  label,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full border",
        primary
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface-2 text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Block({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-foreground">{body}</p>
    </div>
  );
}
