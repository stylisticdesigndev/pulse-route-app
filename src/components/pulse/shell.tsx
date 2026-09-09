import { Link, useRouterState } from "@tanstack/react-router";
import { Map, Package, LineChart, User } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";


const NAV = [
  { to: "/manifest", label: "Manifest", icon: Map },
  { to: "/parcels", label: "Parcels", icon: Package },
  { to: "/metrics", label: "Metrics", icon: LineChart },
  { to: "/profile", label: "Profile", icon: User },
] as const;

/** Fixed-viewport mobile frame: content scrolls, chrome stays put. */
export function AppShell({
  children,
  bottomNav = false,
  className,
}: {
  children: ReactNode;
  bottomNav?: boolean;
  className?: string;
}) {
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background">
      <div
        data-app-scroll
        className={cn("no-scrollbar flex-1 overflow-y-auto overscroll-contain", className)}
      >
        {children}
      </div>
      {bottomNav ? <BottomNav /> : null}
    </div>
  );
}

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="safe-bottom shrink-0 border-t border-border bg-card px-3 pt-2">
      <ul className="flex items-center justify-between gap-1">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                aria-label={label}
                className={cn(
                  "flex h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={2.2} />
                {active ? <span>{label}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  right,
  left,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  left?: ReactNode;
}) {
  return (
    <header className="safe-top grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/70 bg-background px-4 pb-3">
      <div className="flex min-w-0 items-center gap-3">
        {left}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold">{title}</h1>
          {subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {right}
    </header>
  );
}

export function Pill({
  children,
  tone = "muted",
  className,
}: {
  children: ReactNode;
  tone?: "muted" | "warning" | "success" | "primary" | "destructive";
  className?: string;
}) {
  const tones = {
    muted: "bg-surface-2 text-muted-foreground border-border",
    warning: "bg-warning/15 text-warning border-warning/40",
    success: "bg-success/15 text-success border-success/40",
    primary: "bg-primary/15 text-primary border-primary/40",
    destructive: "bg-destructive/15 text-destructive border-destructive/40",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function BigButton({
  children,
  tone = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "warning" | "success" | "destructive" | "ghost";
}) {
  const tones = {
    primary: "bg-primary text-primary-foreground shadow-[0_10px_30px_-12px_var(--primary)]",
    warning: "bg-warning text-warning-foreground shadow-[0_10px_30px_-12px_var(--warning)]",
    success: "bg-success text-success-foreground shadow-[0_10px_30px_-12px_var(--success)]",
    destructive: "border border-destructive/60 bg-destructive/15 text-destructive",
    ghost: "border border-border bg-surface-2 text-foreground",
  } as const;
  return (
    <button
      {...props}
      className={cn(
        "flex h-14 w-full items-center justify-center gap-2.5 rounded-xl text-base font-bold transition-transform active:scale-[0.98] disabled:opacity-50",
        tones[tone],
        className,
      )}
    >
      {children}
    </button>
  );
}
