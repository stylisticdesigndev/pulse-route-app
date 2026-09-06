import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Camera, ImageUp, Lock, RefreshCw, Save, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DriverAvatar } from "@/components/pulse/avatar";
import { AppShell, BigButton, Pill, ScreenHeader } from "@/components/pulse/shell";
import { ErrorState } from "@/components/pulse/states";
import {
  MANIFEST_CODE,
  useDriver,
  useRemoveAvatar,
  useUpdateDriver,
  useUploadAvatar,
} from "@/lib/pulse-data";

export const Route = createFileRoute("/profile_/edit")({
  head: () => ({
    meta: [
      { title: "Edit Profile — PulseRoute" },
      {
        name: "description",
        content:
          "Update your profile photo, display name, phone number, emergency contact and preferred language.",
      },
      { property: "og:title", content: "Edit Profile — PulseRoute" },
      {
        property: "og:description",
        content: "Manage your PulseRoute driver profile and photo.",
      },
    ],
  }),
  component: EditProfile,
});

const LANGUAGES = ["English", "Español", "Français", "Português"] as const;

function EditProfile() {
  const navigate = useNavigate();
  const { data: driver, isLoading, isError, refetch, isFetching } = useDriver();
  const update = useUpdateDriver();
  const upload = useUploadAvatar();
  const remove = useRemoveAvatar();

  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ file: File; url: string } | null>(null);
  const [form, setForm] = useState({
    display_name: "",
    phone: "",
    emergency_contact: "",
    language: "English",
  });

  useEffect(() => {
    if (!driver) return;
    setForm({
      display_name: driver.display_name,
      phone: driver.phone ?? "",
      emergency_contact: driver.emergency_contact ?? "",
      language: driver.language,
    });
  }, [driver?.id]);

  useEffect(() => () => {
    if (pending) URL.revokeObjectURL(pending.url);
  }, [pending]);

  async function doUpload(file: File) {
    if (!driver) return;
    try {
      await upload.mutateAsync({ driverId: driver.id, file });
      setPending(null);
      toast.success("Profile photo updated");
    } catch {
      toast.error("Photo upload failed — the picture is kept, tap Retry.");
    }
  }

  function pick(file?: File | null) {
    if (!file) return;
    setPending({ file, url: URL.createObjectURL(file) });
    void doUpload(file);
  }

  async function save() {
    if (!driver) return;
    if (!form.display_name.trim()) {
      toast.error("Display name can't be empty");
      return;
    }
    try {
      await update.mutateAsync({
        id: driver.id,
        patch: {
          display_name: form.display_name.trim(),
          phone: form.phone.trim() || null,
          emergency_contact: form.emergency_contact.trim() || null,
          language: form.language,
        },
      });
      toast.success("Profile saved");
      navigate({ to: "/profile" });
    } catch {
      toast.error("Couldn't save your profile. Try again.");
    }
  }

  return (
    <AppShell bottomNav className="flex flex-col">
      <ScreenHeader
        title="Edit profile"
        subtitle="Your details, visible to dispatch"
        left={
          <Link
            to="/profile"
            aria-label="Back to profile"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        }
      />

      <div className="space-y-4 px-4 py-5">
        {isError ? <ErrorState onRetry={() => refetch()} retrying={isFetching} /> : null}
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading profile…</p>
        ) : null}

        {driver ? (
          <>
            <section className="rounded-2xl border border-border bg-surface p-4 text-center">
              <button
                onClick={() => libraryRef.current?.click()}
                aria-label="Change profile photo"
                className="relative mx-auto block h-24 w-24 rounded-full"
              >
                {pending ? (
                  <img
                    src={pending.url}
                    alt="Selected profile photo"
                    className="h-24 w-24 rounded-full border border-border object-cover"
                  />
                ) : (
                  <DriverAvatar size={96} className="mx-auto" />
                )}
                <span className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground">
                  <Camera className="h-4 w-4" />
                </span>
              </button>

              {upload.isPending ? (
                <p className="mt-3 flex items-center justify-center gap-2 text-xs font-bold text-primary">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Uploading photo…
                </p>
              ) : pending ? (
                <button
                  onClick={() => void doUpload(pending.file)}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-warning/50 bg-warning/10 px-3 py-1.5 text-xs font-bold text-warning"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Upload failed — Retry
                </button>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">
                  {driver.avatar_path ? "Photo synced with dispatch" : "No photo — initials shown"}
                </p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => cameraRef.current?.click()}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 text-sm font-bold"
                >
                  <Camera className="h-4 w-4" /> Take photo
                </button>
                <button
                  onClick={() => libraryRef.current?.click()}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 text-sm font-bold"
                >
                  <ImageUp className="h-4 w-4" /> Library
                </button>
              </div>
              {driver.avatar_path || pending ? (
                <button
                  onClick={async () => {
                    setPending(null);
                    await remove.mutateAsync({ driverId: driver.id, path: driver.avatar_path });
                    toast.message("Photo removed");
                  }}
                  className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove photo
                </button>
              ) : null}

              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => pick(e.target.files?.[0])}
              />
              <input
                ref={libraryRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => pick(e.target.files?.[0])}
              />
            </section>

            <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
              <Field
                label="Display name"
                value={form.display_name}
                onChange={(v) => setForm((f) => ({ ...f, display_name: v }))}
              />
              <Field
                label="Mobile number"
                value={form.phone}
                inputMode="tel"
                onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              />
              <Field
                label="Emergency contact"
                value={form.emergency_contact}
                onChange={(v) => setForm((f) => ({ ...f, emergency_contact: v }))}
              />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Preferred language
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setForm((f) => ({ ...f, language: lang }))}
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                        form.language === lang
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-surface-2 text-muted-foreground"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                <p className="truncate text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Managed by dispatch
                </p>
                <Pill>
                  <Lock className="h-3 w-3" /> Read only
                </Pill>
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                <ReadRow label="Driver ID" value={driver.driver_code} />
                <ReadRow label="Company" value={driver.company} />
                <ReadRow label="Assigned vehicle" value={driver.vehicle} />
                <ReadRow label="Active manifest" value={`#${MANIFEST_CODE}`} />
              </dl>
            </section>
          </>
        ) : null}
      </div>

      <div className="mt-auto border-t border-border/70 bg-background px-4 pt-3 pb-3">
        <BigButton onClick={save} disabled={!driver || update.isPending}>
          <Save className="h-5 w-5" /> Save profile
        </BigButton>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputMode?: "tel" | "text";
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-12 w-full rounded-xl border border-border bg-background px-4 text-base font-semibold outline-none focus:border-primary"
      />
    </label>
  );
}

function ReadRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <dt className="truncate text-muted-foreground">{label}</dt>
      <dd className="truncate font-bold">{value}</dd>
    </div>
  );
}
