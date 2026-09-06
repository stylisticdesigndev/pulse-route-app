import { Link } from "@tanstack/react-router";
import { AlertTriangle, Lock, RefreshCw, ShieldAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { BigButton } from "@/components/pulse/shell";
import { cn } from "@/lib/utils";

/** Neutral "nothing here yet" block used by every list screen. */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  tone = "muted",
  className,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
  tone?: "muted" | "success" | "primary" | "warning";
  className?: string;
}) {
  const tones = {
    muted: "bg-surface-2 text-muted-foreground",
    success: "bg-success/15 text-success",
    primary: "bg-primary/15 text-primary",
    warning: "bg-warning/15 text-warning",
  } as const;
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface px-5 py-8 text-center",
        className,
      )}
    >
      <span
        className={cn(
          "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl",
          tones[tone],
        )}
      >
        <Icon className="h-7 w-7" />
      </span>
      <p className="mt-4 text-base font-bold">{title}</p>
      <p className="mx-auto mt-1 max-w-[34ch] text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/** Inline failure block with a retry affordance. */
export function ErrorState({
  title = "Couldn't load this",
  body = "The connection dropped before dispatch answered. Nothing was lost — try again.",
  onRetry,
  retrying,
  className,
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-destructive/40 bg-destructive/10 px-5 py-6 text-center",
        className,
      )}
    >
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/20 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <p className="mt-3 text-base font-bold">{title}</p>
      <p className="mx-auto mt-1 max-w-[34ch] text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
      {onRetry ? (
        <div className="mt-5">
          <BigButton tone="ghost" onClick={onRetry} disabled={retrying}>
            <RefreshCw className={cn("h-5 w-5", retrying && "animate-spin")} />
            {retrying ? "Retrying…" : "Retry"}
          </BigButton>
        </div>
      ) : null}
    </div>
  );
}

/** Shown when the driver opens a shift-only screen with no shift running. */
export function OffShiftState() {
  return (
    <div className="px-4 py-6">
      <EmptyState
        icon={Lock}
        tone="warning"
        title="You're off shift"
        body="Clock in and clear the pre-trip checklist to load today's manifest."
        action={
          <Link to="/">
            <BigButton>Start shift</BigButton>
          </Link>
        }
      />
    </div>
  );
}

/** Device permission denied card with plain-language enable steps. */
export function PermissionGate({
  kind,
  onRetry,
}: {
  kind: "location" | "camera";
  onRetry?: () => void;
}) {
  const copy =
    kind === "location"
      ? {
          title: "Location is turned off",
          body: "PulseRoute needs your location to guide you and to confirm you're at the right door.",
        }
      : {
          title: "Camera access is blocked",
          body: "The scanner needs the camera to read parcel barcodes. You can still enter codes by hand.",
        };
  return (
    <div className="rounded-2xl border border-warning/40 bg-warning/10 px-5 py-6 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/20 text-warning">
        <ShieldAlert className="h-6 w-6" />
      </span>
      <p className="mt-3 text-base font-bold">{copy.title}</p>
      <p className="mx-auto mt-1 max-w-[34ch] text-sm leading-relaxed text-muted-foreground">
        {copy.body}
      </p>
      <ol className="mx-auto mt-4 max-w-[32ch] space-y-1 text-left text-xs text-muted-foreground">
        <li>1. Open your phone settings.</li>
        <li>2. Find PulseRoute in the app list.</li>
        <li>3. Allow {kind === "location" ? "Location" : "Camera"} access, then come back.</li>
      </ol>
      {onRetry ? (
        <div className="mt-5">
          <BigButton tone="ghost" onClick={onRetry}>
            <RefreshCw className="h-5 w-5" /> Check again
          </BigButton>
        </div>
      ) : null}
    </div>
  );
}
