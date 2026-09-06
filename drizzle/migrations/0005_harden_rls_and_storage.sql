-- 1. Role helpers, locked down
CREATE OR REPLACE FUNCTION public.is_apex_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id)
$$;

REVOKE ALL ON FUNCTION public.is_apex_staff(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_apex_staff(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_apex_staff(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_dispatch_supervisor(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_dispatch_supervisor(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_dispatch_supervisor(uuid) TO authenticated, service_role;

-- 2. Remove every open demo policy
DROP POLICY IF EXISTS "demo full access deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "demo full access events" ON public.delivery_events;
DROP POLICY IF EXISTS "demo full access dispatch" ON public.dispatch_messages;
DROP POLICY IF EXISTS "demo full access drivers" ON public.drivers;
DROP POLICY IF EXISTS "demo full access packages" ON public.packages;
DROP POLICY IF EXISTS "demo read profiles" ON public.profiles;
DROP POLICY IF EXISTS "demo read routes" ON public.routes;
DROP POLICY IF EXISTS "demo full access shifts" ON public.shifts;
DROP POLICY IF EXISTS "demo full access stops" ON public.stops;

DROP POLICY IF EXISTS "Users can read own profile or dispatchers can read all" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile data" ON public.profiles;
DROP POLICY IF EXISTS "Drivers can view assigned routes and supervisors view all" ON public.routes;
DROP POLICY IF EXISTS "Supervisors manage routes" ON public.routes;
DROP POLICY IF EXISTS "Drivers view stops for their assigned routes" ON public.stops;
DROP POLICY IF EXISTS "Drivers and Supervisors view delivery records" ON public.deliveries;
DROP POLICY IF EXISTS "Drivers can update deliveries on assigned stops" ON public.deliveries;
DROP POLICY IF EXISTS "Drivers insert own telemetry" ON public.location_logs;
DROP POLICY IF EXISTS "Supervisors read fleet telemetry" ON public.location_logs;

-- 3. Revoke anonymous Data API access everywhere
REVOKE ALL ON public.profiles, public.routes, public.stops, public.deliveries,
  public.delivery_events, public.location_logs, public.dispatch_messages,
  public.drivers, public.packages, public.shifts FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stops, public.deliveries,
  public.delivery_events, public.dispatch_messages, public.drivers,
  public.packages, public.shifts, public.routes TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT INSERT ON public.location_logs TO authenticated;
GRANT SELECT ON public.location_logs TO authenticated;
GRANT ALL ON public.profiles, public.routes, public.stops, public.deliveries,
  public.delivery_events, public.location_logs, public.dispatch_messages,
  public.drivers, public.packages, public.shifts TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.location_logs_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.location_logs_id_seq TO service_role;

-- 4. Profiles
CREATE POLICY "Staff read own profile, supervisors read all" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_dispatch_supervisor(auth.uid()));
CREATE POLICY "Staff update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 5. Routes
CREATE POLICY "Drivers read assigned routes" ON public.routes
  FOR SELECT TO authenticated
  USING (driver_id = auth.uid() OR public.is_dispatch_supervisor(auth.uid()));
CREATE POLICY "Supervisors manage routes" ON public.routes
  FOR ALL TO authenticated
  USING (public.is_dispatch_supervisor(auth.uid()))
  WITH CHECK (public.is_dispatch_supervisor(auth.uid()));

-- 6. Stops
CREATE POLICY "Drivers read assigned stops" ON public.stops
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.routes r WHERE r.id = stops.route_id
      AND (r.driver_id = auth.uid() OR public.is_dispatch_supervisor(auth.uid()))
  ));
CREATE POLICY "Drivers update assigned stops" ON public.stops
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.routes r WHERE r.id = stops.route_id
      AND (r.driver_id = auth.uid() OR public.is_dispatch_supervisor(auth.uid()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.routes r WHERE r.id = stops.route_id
      AND (r.driver_id = auth.uid() OR public.is_dispatch_supervisor(auth.uid()))
  ));
CREATE POLICY "Supervisors insert stops" ON public.stops
  FOR INSERT TO authenticated
  WITH CHECK (public.is_dispatch_supervisor(auth.uid()));

-- 7. Deliveries
CREATE POLICY "Assigned drivers read deliveries" ON public.deliveries
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stops s JOIN public.routes r ON r.id = s.route_id
    WHERE s.id = deliveries.stop_id
      AND (r.driver_id = auth.uid() OR public.is_dispatch_supervisor(auth.uid()))
  ));
CREATE POLICY "Assigned drivers insert deliveries" ON public.deliveries
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stops s JOIN public.routes r ON r.id = s.route_id
    WHERE s.id = deliveries.stop_id
      AND (r.driver_id = auth.uid() OR public.is_dispatch_supervisor(auth.uid()))
  ));
CREATE POLICY "Assigned drivers update deliveries" ON public.deliveries
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stops s JOIN public.routes r ON r.id = s.route_id
    WHERE s.id = deliveries.stop_id
      AND (r.driver_id = auth.uid() OR public.is_dispatch_supervisor(auth.uid()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stops s JOIN public.routes r ON r.id = s.route_id
    WHERE s.id = deliveries.stop_id
      AND (r.driver_id = auth.uid() OR public.is_dispatch_supervisor(auth.uid()))
  ));

-- 8. Packages (child of stops)
CREATE POLICY "Assigned drivers read packages" ON public.packages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stops s LEFT JOIN public.routes r ON r.id = s.route_id
    WHERE s.id = packages.stop_id
      AND (r.driver_id = auth.uid() OR public.is_dispatch_supervisor(auth.uid()))
  ));
CREATE POLICY "Assigned drivers update packages" ON public.packages
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stops s LEFT JOIN public.routes r ON r.id = s.route_id
    WHERE s.id = packages.stop_id
      AND (r.driver_id = auth.uid() OR public.is_dispatch_supervisor(auth.uid()))
  ))
  WITH CHECK (true);

-- 9. Delivery events
CREATE POLICY "Assigned drivers read events" ON public.delivery_events
  FOR SELECT TO authenticated
  USING (
    public.is_dispatch_supervisor(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.stops s JOIN public.routes r ON r.id = s.route_id
      WHERE s.id = delivery_events.stop_id AND r.driver_id = auth.uid()
    )
  );
CREATE POLICY "Assigned drivers log events" ON public.delivery_events
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_dispatch_supervisor(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.stops s JOIN public.routes r ON r.id = s.route_id
      WHERE s.id = delivery_events.stop_id AND r.driver_id = auth.uid()
    )
  );

-- 10. Shifts / drivers / dispatch messages: authenticated staff only
CREATE POLICY "Staff read shifts" ON public.shifts
  FOR SELECT TO authenticated USING (public.is_apex_staff(auth.uid()));
CREATE POLICY "Staff write shifts" ON public.shifts
  FOR INSERT TO authenticated WITH CHECK (public.is_apex_staff(auth.uid()));
CREATE POLICY "Staff update shifts" ON public.shifts
  FOR UPDATE TO authenticated USING (public.is_apex_staff(auth.uid()))
  WITH CHECK (public.is_apex_staff(auth.uid()));

CREATE POLICY "Staff read drivers" ON public.drivers
  FOR SELECT TO authenticated USING (public.is_apex_staff(auth.uid()));
CREATE POLICY "Staff update drivers" ON public.drivers
  FOR UPDATE TO authenticated USING (public.is_apex_staff(auth.uid()))
  WITH CHECK (public.is_apex_staff(auth.uid()));

CREATE POLICY "Staff read dispatch messages" ON public.dispatch_messages
  FOR SELECT TO authenticated USING (public.is_apex_staff(auth.uid()));
CREATE POLICY "Staff update dispatch messages" ON public.dispatch_messages
  FOR UPDATE TO authenticated USING (public.is_apex_staff(auth.uid()))
  WITH CHECK (public.is_apex_staff(auth.uid()));
CREATE POLICY "Staff insert dispatch messages" ON public.dispatch_messages
  FOR INSERT TO authenticated WITH CHECK (public.is_apex_staff(auth.uid()));

-- 11. Telemetry
CREATE POLICY "Drivers insert own telemetry" ON public.location_logs
  FOR INSERT TO authenticated WITH CHECK (driver_id = auth.uid());
CREATE POLICY "Supervisors read fleet telemetry" ON public.location_logs
  FOR SELECT TO authenticated USING (public.is_dispatch_supervisor(auth.uid()));

-- 12. Storage lockdown
DROP POLICY IF EXISTS "Demo access proof of service" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users view proof of service" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users upload proof of service" ON storage.objects;
DROP POLICY IF EXISTS "demo delete driver avatars" ON storage.objects;
DROP POLICY IF EXISTS "demo update driver avatars" ON storage.objects;
DROP POLICY IF EXISTS "demo insert driver avatars" ON storage.objects;
DROP POLICY IF EXISTS "demo read driver avatars" ON storage.objects;

CREATE POLICY "Apex staff read fleet media" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id IN ('proof-of-service', 'driver-avatars') AND public.is_apex_staff(auth.uid()));
CREATE POLICY "Apex staff upload fleet media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('proof-of-service', 'driver-avatars') AND public.is_apex_staff(auth.uid()));
CREATE POLICY "Apex staff update fleet media" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id IN ('proof-of-service', 'driver-avatars') AND public.is_apex_staff(auth.uid()))
  WITH CHECK (bucket_id IN ('proof-of-service', 'driver-avatars') AND public.is_apex_staff(auth.uid()));
CREATE POLICY "Apex staff delete fleet media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('proof-of-service', 'driver-avatars') AND public.is_apex_staff(auth.uid()));
