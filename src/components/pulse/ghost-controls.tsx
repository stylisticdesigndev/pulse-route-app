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

      {running && caption?.kind === "role" ? (
        <div className="pointer-events-none fixed inset-0 z-[68] flex items-center justify-center px-6">
          <div className="animate-scale-in w-full max-w-sm rounded-2xl border border-primary/40 bg-card/95 p-5 shadow-2xl backdrop-blur">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                caption.role === "courier"
                  ? "bg-primary/15 text-primary"
                  : "bg-warning/15 text-warning"
              }`}
            >
              {caption.role === "courier" ? (
                <Truck className="h-3.5 w-3.5" />
              ) : (
                <Radio className="h-3.5 w-3.5" />
              )}
              {caption.role === "courier" ? "Field courier" : "Dispatch supervisor"}
            </span>
            <p className="mt-3 text-lg font-bold leading-tight">{caption.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{caption.body}</p>
          </div>
        </div>
      ) : null}

      {running && caption?.kind === "step" ? (
        <div
          className="pointer-events-none fixed inset-x-3 z-[66]"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 5.25rem)" }}
        >
          <div className="animate-fade-in rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-xl backdrop-blur">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                  caption.role === "courier"
                    ? "bg-primary/15 text-primary"
                    : "bg-warning/15 text-warning"
                }`}
              >
                {caption.role === "courier" ? "Courier" : "Dispatch"}
              </span>
              {caption.step ? (
                <span className="text-[10px] font-bold text-muted-foreground">
                  Step {caption.step} of {caption.total}
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 text-sm font-bold leading-tight">{caption.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{caption.body}</p>
          </div>
        </div>
      ) : null}

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
