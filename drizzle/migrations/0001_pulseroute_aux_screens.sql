ALTER TABLE public.shifts
  ADD COLUMN IF NOT EXISTS break_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS break_seconds integer NOT NULL DEFAULT 0;

ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS returned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivered boolean NOT NULL DEFAULT false;

ALTER TABLE public.delivery_events
  ADD COLUMN IF NOT EXISTS attempt integer NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_code text NOT NULL UNIQUE,
  display_name text NOT NULL,
  company text NOT NULL DEFAULT 'Apex Move Dynamics',
  phone text,
  emergency_contact text,
  language text NOT NULL DEFAULT 'English',
  vehicle text NOT NULL DEFAULT 'Van #408 - Ford Transit',
  avatar_path text,
  nav_preference text NOT NULL DEFAULT 'built_in',
  torch_default boolean NOT NULL DEFAULT false,
  haptics boolean NOT NULL DEFAULT true,
  units text NOT NULL DEFAULT 'imperial',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.drivers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drivers TO anon;
GRANT ALL ON public.drivers TO service_role;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo full access drivers" ON public.drivers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.dispatch_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text NOT NULL,
  stop_id uuid REFERENCES public.stops(id) ON DELETE SET NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dispatch_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dispatch_messages TO anon;
GRANT ALL ON public.dispatch_messages TO service_role;
ALTER TABLE public.dispatch_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo full access dispatch" ON public.dispatch_messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS dispatch_messages_created_idx ON public.dispatch_messages (created_at DESC);