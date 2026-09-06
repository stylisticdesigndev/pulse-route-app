import { initialsOf, useAvatarUrl, useDriver } from "@/lib/pulse-data";
import { cn } from "@/lib/utils";

/** Driver photo with initials fallback, used everywhere the avatar appears. */
export function DriverAvatar({
  size = 48,
  name,
  path,
  className,
}: {
  size?: number;
  name?: string;
  path?: string | null;
  className?: string;
}) {
  const { data: driver } = useDriver();
  const displayName = name ?? driver?.display_name ?? "Driver";
  const avatarPath = path !== undefined ? path : driver?.avatar_path ?? null;
  const { data: url } = useAvatarUrl(avatarPath);

  return (
    <span
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-primary/15 font-bold text-primary",
        className,
      )}
    >
      {url ? (
        <img
          src={url}
          alt={`${displayName} profile photo`}
          className="h-full w-full object-cover"
        />
      ) : (
        initialsOf(displayName)
      )}
    </span>
  );
}
