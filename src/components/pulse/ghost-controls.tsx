import { useEffect, useState } from "react";
import {
  Play,
  Square,
  Truck,
  Radio,
  MessageSquare,
  MessageSquareOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useGhost } from "@/lib/ghost-demo";

/** How long a step note stays fully visible before it fades away. */
const FADE_AFTER_MS = 5200;

/** Discreet demo trigger, narration, the animated touch indicator, and the stop control. */
export function GhostControls() {
  const { running, cursor, caption, history, captionsOn, toggleCaptions, start, stop } = useGhost();

  /** null = follow the live step; a number = the viewer is reading an earlier note. */
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);
  const [faded, setFaded] = useState(false);

  // Each new note appears at full strength, then fades so it never blocks the screen.
  useEffect(() => {
    if (!caption) return;
    setFaded(false);
    if (caption.kind === "role") return;
    const id = window.setTimeout(() => setFaded(true), FADE_AFTER_MS);
    return () => window.clearTimeout(id);
  }, [caption]);

  useEffect(() => {
    if (!running) setReviewIndex(null);
  }, [running]);

  const reviewing = reviewIndex !== null;
  const shown = reviewing ? history[reviewIndex] ?? null : caption;
  const stepOpacity = reviewing || !faded ? "opacity-100" : "opacity-25";
  const canBack = history.length > 1 && (reviewIndex === null ? true : reviewIndex > 0);

  const goBack = () => {
    const from = reviewIndex === null ? history.length - 1 : reviewIndex;
    setReviewIndex(Math.max(0, from - 1));
    setFaded(false);
  };

  const goForward = () => {
    if (reviewIndex === null) return;
    const next = reviewIndex + 1;
    setReviewIndex(next >= history.length - 1 ? null : next);
    setFaded(false);
  };

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
        <div
          className="fixed right-3 z-[60] flex items-center gap-1.5"
          style={{ top: "max(2.75rem, calc(env(safe-area-inset-top) + 0.5rem))" }}
        >
          <button
            onClick={toggleCaptions}
            aria-label={captionsOn ? "Hide step notes" : "Show step notes"}
            className="flex h-8 items-center gap-1.5 rounded-full border border-border bg-card/90 px-2.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground backdrop-blur"
          >
            {captionsOn ? (
              <MessageSquare className="h-3 w-3 text-primary" strokeWidth={2.6} />
            ) : (
              <MessageSquareOff className="h-3 w-3" strokeWidth={2.6} />
            )}
            Steps
          </button>
          <button
            onClick={stop}
            className="flex h-8 items-center gap-1.5 rounded-full border border-destructive/50 bg-destructive/15 px-2.5 text-[10px] font-bold uppercase tracking-wide text-destructive backdrop-blur"
          >
            <Square className="h-3 w-3" strokeWidth={3} /> Stop
          </button>
        </div>
      )}

      {running && shown?.kind === "role" ? (
        <div className="pointer-events-none fixed inset-0 z-[68] flex items-center justify-center px-6">
          <div className="animate-scale-in w-full max-w-sm rounded-2xl border border-primary/40 bg-card/95 p-5 shadow-2xl backdrop-blur">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                shown.role === "courier"
                  ? "bg-primary/15 text-primary"
                  : "bg-warning/15 text-warning"
              }`}
            >
              {shown.role === "courier" ? (
                <Truck className="h-3.5 w-3.5" />
              ) : (
                <Radio className="h-3.5 w-3.5" />
              )}
              {shown.role === "courier" ? "Field courier" : "Dispatch supervisor"}
            </span>
            <p className="mt-3 text-lg font-bold leading-tight">{shown.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{shown.body}</p>
          </div>
        </div>
      ) : null}

      {running && captionsOn && shown?.kind === "step" ? (
        <div
          className="fixed inset-x-3 z-[66]"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 11.5rem)" }}
        >
          <div
            className={`rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-xl backdrop-blur transition-opacity duration-700 ${stepOpacity}`}
            onMouseEnter={() => setFaded(false)}
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                  shown.role === "courier"
                    ? "bg-primary/15 text-primary"
                    : "bg-warning/15 text-warning"
                }`}
              >
                {shown.role === "courier" ? "Courier" : "Dispatch"}
              </span>
              {shown.step ? (
                <span className="text-[10px] font-bold text-muted-foreground">
                  Step {shown.step} of {shown.total}
                </span>
              ) : null}
              {reviewing ? (
                <span className="text-[10px] font-bold text-primary">Replay</span>
              ) : null}
              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={goBack}
                  disabled={!canBack}
                  aria-label="Previous step note"
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-muted-foreground disabled:opacity-30"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={goForward}
                  disabled={!reviewing}
                  aria-label="Next step note"
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-muted-foreground disabled:opacity-30"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <p className="mt-1.5 text-sm font-bold leading-tight">{shown.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{shown.body}</p>
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
