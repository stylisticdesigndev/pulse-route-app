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

  // Hands-free demo: writes a legible cursive "M. Vance" stroke by stroke.
  useEffect(() => {
    if (!autoSign) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    // Normalised key points (0-1) for each pen-down stroke of the signature.
    const strokes: [number, number][][] = [
      // Capital M with an entry flick
      [
        [0.08, 0.72],
        [0.1, 0.3],
        [0.15, 0.68],
        [0.2, 0.32],
        [0.25, 0.7],
        [0.29, 0.58],
      ],
      // period after the initial
      [
        [0.32, 0.7],
        [0.33, 0.71],
      ],
      // cursive "Vance" body: v-a-n-c-e with loops
      [
        [0.38, 0.34],
        [0.42, 0.7],
        [0.47, 0.3],
        [0.5, 0.62],
        [0.53, 0.48],
        [0.5, 0.44],
        [0.49, 0.56],
        [0.54, 0.68],
        [0.58, 0.44],
        [0.6, 0.66],
        [0.63, 0.46],
        [0.66, 0.66],
        [0.7, 0.5],
        [0.68, 0.44],
        [0.66, 0.52],
        [0.7, 0.66],
        [0.75, 0.56],
        [0.72, 0.5],
        [0.76, 0.5],
        [0.79, 0.62],
      ],
      // underline flourish
      [
        [0.8, 0.66],
        [0.62, 0.82],
        [0.3, 0.8],
        [0.14, 0.86],
      ],
    ];

    // Densify each stroke so the pen glides rather than jumps between corners.
    const segments = strokes.map((stroke) => {
      const pts: { x: number; y: number }[] = [];
      for (let s = 0; s < stroke.length - 1; s += 1) {
        const [x0, y0] = stroke[s]!;
        const [x1, y1] = stroke[s + 1]!;
        const steps = 8;
        for (let k = 0; k < steps; k += 1) {
          const t = k / steps;
          const ease = t * t * (3 - 2 * t);
          pts.push({ x: w * (x0 + (x1 - x0) * ease), y: h * (y0 + (y1 - y0) * ease) });
        }
      }
      const [lx, ly] = stroke[stroke.length - 1]!;
      pts.push({ x: w * lx, y: h * ly });
      return pts;
    });

    // Flatten into a timeline with pen-lift markers between strokes.
    const timeline: ({ x: number; y: number; lift: boolean })[] = [];
    segments.forEach((pts) => {
      pts.forEach((p, i) => timeline.push({ ...p, lift: i === 0 }));
    });

    let i = 0;
    const timer = window.setInterval(() => {
      const point = timeline[i];
      if (!point) {
        window.clearInterval(timer);
        return;
      }
      if (point.lift) {
        ctx.beginPath();
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
    }, 14);
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
