import { Play, Square, Truck, Radio } from "lucide-react";
import { useGhost } from "@/lib/ghost-demo";

/** Discreet demo trigger, narration, the animated touch indicator, and the stop control. */
export function GhostControls() {
  const { running, cursor, caption, start, stop } = useGhost();



  return (
    <>
      {!running ? (
        <button
          onClick={start}
          className="fixed left-3 z-[60] flex h-9 items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 text-[11px] font-semibold text-muted-foreground shadow-lg backdrop-blur"
          style={{ top: "max(2.75rem, calc(env(safe-area-inset-top) + 0.5rem))" }}
        >
          <Play className="h-3.5 w-3.5 text-primary" strokeWidth={2.6} /> Run Full Experience Demo
        </button>
      ) : (
        <button
          onClick={stop}
          className="fixed right-3 z-[60] flex h-8 items-center gap-1.5 rounded-full border border-destructive/50 bg-destructive/15 px-2.5 text-[10px] font-bold uppercase tracking-wide text-destructive backdrop-blur"
          style={{ top: "max(2.75rem, calc(env(safe-area-inset-top) + 0.5rem))" }}
        >
          <Square className="h-3 w-3" strokeWidth={3} /> Stop Demo
        </button>
      )}

      {running && cursor.visible ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[70] h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/70 bg-primary/25 shadow-[0_0_24px_var(--primary)] transition-all duration-700 ease-in-out"
          style={{
            left: cursor.x,
            top: cursor.y,
            transform: `translate(-50%, -50%) scale(${cursor.pressed ? 0.7 : 1})`,
            opacity: cursor.pressed ? 1 : 0.75,
          }}
        />
      ) : null}

    </>
  );
}
