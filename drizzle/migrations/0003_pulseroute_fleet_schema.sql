-- 1. Enums
CREATE TYPE public.user_role AS ENUM ('dispatch_supervisor', 'field_technician');
CREATE TYPE public.route_status AS ENUM ('draft', 'assigned', 'active', 'completed');
CREATE TYPE public.delivery_status AS ENUM ('pending', 'in_transit', 'delivered', 'failed');

-- 2. Profiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY,
    full_name TEXT NOT NULL,
    role public.user_role NOT NULL DEFAULT 'field_technician',
    phone_number TEXT,
    vehicle_identifier TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Routes
CREATE TABLE public.routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    dispatcher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    code TEXT,
    status public.route_status NOT NULL DEFAULT 'draft',
    scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_distance_miles NUMERIC(6, 2) DEFAULT 0.00,
    estimated_duration_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.routes TO authenticated;
GRANT SELECT ON public.routes TO anon;
GRANT ALL ON public.routes TO service_role;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

-- 4. Stops: extend existing table with the new relational shape (additive, non-breaking)
ALTER TABLE public.stops
    ADD COLUMN IF NOT EXISTS route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS sequence_order INTEGER,
    ADD COLUMN IF NOT EXISTS recipient_name TEXT,
    ADD COLUMN IF NOT EXISTS address_line1 TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS state TEXT,
    ADD COLUMN IF NOT EXISTS zip_code TEXT,
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS delivery_window_start TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS delivery_window_end TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS access_notes TEXT;
CREATE INDEX IF NOT EXISTS stops_route_id_seq_idx ON public.stops (route_id, sequence_order);

-- 5. Deliveries
CREATE TABLE public.deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stop_id UUID NOT NULL REFERENCES public.stops(id) ON DELETE CASCADE,
    tracking_number TEXT NOT NULL UNIQUE,
    status public.delivery_status NOT NULL DEFAULT 'pending',
    failure_reason TEXT,
    photo_url TEXT,
    signature_url TEXT,
    completed_at TIMESTAMPTZ,
    dropoff_latitude DOUBLE PRECISION,
    dropoff_longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deliveries TO authenticated;
GRANT SELECT ON public.deliveries TO anon;
GRANT ALL ON public.deliveries TO service_role;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- 6. Location logs (telemetry)
CREATE TABLE public.location_logs (
    id BIGSERIAL PRIMARY KEY,
    driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    speed_mph NUMERIC(5, 2),
    heading_degrees NUMERIC(5, 2),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.location_logs TO authenticated;
GRANT ALL ON public.location_logs TO service_role;
ALTER TABLE public.location_logs ENABLE ROW LEVEL SECURITY;

-- 7. Helper to avoid recursive profile policy lookups
CREATE OR REPLACE FUNCTION public.is_dispatch_supervisor(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role = 'dispatch_supervisor'
  )
$$;

-- 8. Policies
CREATE POLICY "Users can read own profile or dispatchers can read all"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_dispatch_supervisor(auth.uid()));

CREATE POLICY "Users can update own profile data"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "demo read profiles"
ON public.profiles FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Drivers can view assigned routes and supervisors view all"
ON public.routes FOR SELECT
USING (driver_id = auth.uid() OR public.is_dispatch_supervisor(auth.uid()));

CREATE POLICY "Supervisors manage routes"
ON public.routes FOR ALL
USING (public.is_dispatch_supervisor(auth.uid()));

CREATE POLICY "demo read routes"
ON public.routes FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Drivers view stops for their assigned routes"
ON public.stops FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.routes
        WHERE routes.id = stops.route_id
        AND (routes.driver_id = auth.uid() OR public.is_dispatch_supervisor(auth.uid()))
    )
);

CREATE POLICY "Drivers and Supervisors view delivery records"
ON public.deliveries FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.stops
        JOIN public.routes ON routes.id = stops.route_id
        WHERE stops.id = deliveries.stop_id
        AND (routes.driver_id = auth.uid() OR public.is_dispatch_supervisor(auth.uid()))
    )
);

CREATE POLICY "Drivers can update deliveries on assigned stops"
ON public.deliveries FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.stops
        JOIN public.routes ON routes.id = stops.route_id
        WHERE stops.id = deliveries.stop_id
        AND routes.driver_id = auth.uid()
    )
);

CREATE POLICY "demo full access deliveries"
ON public.deliveries FOR ALL
TO anon, authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Drivers insert own telemetry"
ON public.location_logs FOR INSERT
WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Supervisors read fleet telemetry"
ON public.location_logs FOR SELECT
USING (public.is_dispatch_supervisor(auth.uid()));
