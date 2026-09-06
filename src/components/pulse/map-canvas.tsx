import { cn } from "@/lib/utils";

type Variant = "overview" | "turn" | "reroute";

/** Stylised dark street grid used by the manifest, navigation and reroute screens. */
export function MapCanvas({
  variant = "overview",
  stopLabel,
  className,
}: {
  variant?: Variant;
  stopLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-map", className)}>
      <svg
        viewBox="0 0 360 520"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {[
          [10, 10],
          [140, 10],
          [270, 10],
          [10, 150],
          [140, 150],
          [270, 150],
          [10, 290],
          [140, 290],
          [270, 290],
          [10, 430],
          [140, 430],
          [270, 430],
        ].map(([x, y]) => (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width={110}
            height={120}
            rx={6}
            fill="var(--map-block)"
          />
        ))}
        <g stroke="var(--map-road)" strokeWidth="16">
          <line x1="0" y1="140" x2="360" y2="140" />
          <line x1="0" y1="280" x2="360" y2="280" />
          <line x1="0" y1="420" x2="360" y2="420" />
          <line x1="130" y1="0" x2="130" y2="520" />
          <line x1="260" y1="0" x2="260" y2="520" />
        </g>

        {variant === "overview" ? (
          <polyline
            points="130,470 130,280 60,280 60,60 250,60"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {variant === "turn" ? (
          <polyline
            points="130,510 130,280 260,280 260,60"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {variant === "reroute" ? (
          <>
            <polyline
              points="130,430 130,180 260,180 260,300"
              fill="none"
              stroke="var(--destructive)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="130,520 130,300 260,300 260,180"
              fill="none"
              stroke="var(--success)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : null}
      </svg>

      {variant === "overview" ? (
        <>
          <div className="absolute left-[34%] bottom-[8%] h-4 w-4 rounded-full border-2 border-white bg-primary animate-pulse-dot" />
          {stopLabel ? (
            <div className="absolute left-[66%] top-[9%] flex h-8 w-8 items-center justify-center rounded-full bg-warning text-xs font-black text-warning-foreground shadow-lg">
              {stopLabel}
            </div>
          ) : null}
        </>
      ) : null}

      {variant === "turn" ? (
        <div className="absolute left-[34%] top-[52%] flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow-lg">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M4 20V10a4 4 0 0 1 4-4h9" />
            <path d="m14 3 4 3-4 3" />
          </svg>
        </div>
      ) : null}
    </div>
  );
}
