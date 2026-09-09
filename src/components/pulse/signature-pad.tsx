import { useEffect, useRef, useState } from "react";

/** Touch/mouse signature capture. Reports the encoded path whenever it changes. */
export function SignaturePad({
  onChange,
  autoSign = false,
}: {
  onChange: (path: string | null) => void;
  /** Scripted demo: draws a signature by itself so the flow can run hands-free. */
  autoSign?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const points = useRef<string[]>([]);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#34d399";
  }, []);

  // Hands-free demo: trace a natural-looking signature stroke by stroke.
  useEffect(() => {
    if (!autoSign) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const path: { x: number; y: number }[] = [];
    for (let i = 0; i <= 90; i += 1) {
      const t = i / 90;
      path.push({
        x: w * (0.12 + t * 0.74),
        y: h * (0.55 - Math.sin(t * Math.PI * 3) * 0.24 - t * 0.06),
      });
    }
    let i = 0;
    ctx.beginPath();
    const timer = window.setInterval(() => {
      const point = path[i];
      if (!point) {
        window.clearInterval(timer);
        return;
      }
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
        points.current.push(`M${Math.round(point.x)},${Math.round(point.y)}`);
      } else {
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        points.current.push(`L${Math.round(point.x)},${Math.round(point.y)}`);
      }
      setHasInk(true);
      onChange(points.current.join(" "));
      i += 1;
    }, 12);
    return () => window.clearInterval(timer);
  }, [autoSign, onChange]);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    drawing.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
    points.current.push(`M${Math.round(x)},${Math.round(y)}`);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    points.current.push(`L${Math.round(x)},${Math.round(y)}`);
    if (!hasInk) setHasInk(true);
    onChange(points.current.join(" "));
  }

  function end() {
    drawing.current = false;
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    points.current = [];
    setHasInk(false);
    onChange(null);
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold">Recipient Signature</span>
        <button onClick={clear} className="text-xs font-bold text-destructive">
          Clear
        </button>
      </div>
      <div className="relative rounded-lg border border-dashed border-border bg-background">
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="h-28 w-full touch-none"
        />
        {!hasInk ? (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            Sign here with your finger
          </span>
        ) : null}
      </div>
    </div>
  );
}
