-- Ownership columns (additive, nullable)
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS driver_user_id uuid DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.dispatch_messages ADD COLUMN IF NOT EXISTS recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS drivers_user_id_idx ON public.drivers(user_id);
CREATE INDEX IF NOT EXISTS shifts_driver_user_id_idx ON public.shifts(driver_user_id);
CREATE INDEX IF NOT EXISTS dispatch_messages_recipient_idx ON public.dispatch_messages(recipient_id);

-- Block privilege escalation through self profile updates
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND NOT public.is_dispatch_supervisor(auth.uid()) THEN
    RAISE EXCEPTION 'Only dispatch supervisors can change a profile role';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.prevent_profile_role_escalation() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prevent_profile_role_escalation() FROM anon;
DROP TRIGGER IF EXISTS profiles_block_role_escalation ON public.profiles;
CREATE TRIGGER profiles_block_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_escalation();

-- Drivers: own record only, supervisors see the fleet
DROP POLICY IF EXISTS "Staff read drivers" ON public.drivers;
DROP POLICY IF EXISTS "Staff update drivers" ON public.drivers;
CREATE POLICY "Drivers read own record" ON public.drivers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_dispatch_supervisor(auth.uid()));
CREATE POLICY "Drivers update own record" ON public.drivers
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_dispatch_supervisor(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_dispatch_supervisor(auth.uid()));

-- Shifts: own shifts only
DROP POLICY IF EXISTS "Staff read shifts" ON public.shifts;
DROP POLICY IF EXISTS "Staff write shifts" ON public.shifts;
DROP POLICY IF EXISTS "Staff update shifts" ON public.shifts;
CREATE POLICY "Drivers read own shifts" ON public.shifts
  FOR SELECT TO authenticated
  USING (driver_user_id = auth.uid() OR public.is_dispatch_supervisor(auth.uid()));
CREATE POLICY "Drivers open own shifts" ON public.shifts
  FOR INSERT TO authenticated
  WITH CHECK (driver_user_id = auth.uid());
CREATE POLICY "Drivers update own shifts" ON public.shifts
  FOR UPDATE TO authenticated
  USING (driver_user_id = auth.uid() OR public.is_dispatch_supervisor(auth.uid()))
  WITH CHECK (driver_user_id = auth.uid() OR public.is_dispatch_supervisor(auth.uid()));

-- Dispatch messages: fleet broadcasts plus messages addressed to the caller
DROP POLICY IF EXISTS "Staff read dispatch messages" ON public.dispatch_messages;
DROP POLICY IF EXISTS "Staff update dispatch messages" ON public.dispatch_messages;
DROP POLICY IF EXISTS "Staff insert dispatch messages" ON public.dispatch_messages;
CREATE POLICY "Drivers read own dispatch messages" ON public.dispatch_messages
  FOR SELECT TO authenticated
  USING (
    public.is_dispatch_supervisor(auth.uid())
    OR recipient_id = auth.uid()
    OR (recipient_id IS NULL AND public.is_apex_staff(auth.uid()))
  );
CREATE POLICY "Drivers update own dispatch messages" ON public.dispatch_messages
  FOR UPDATE TO authenticated
  USING (
    public.is_dispatch_supervisor(auth.uid())
    OR recipient_id = auth.uid()
    OR (recipient_id IS NULL AND public.is_apex_staff(auth.uid()))
  )
  WITH CHECK (
    public.is_dispatch_supervisor(auth.uid())
    OR recipient_id = auth.uid()
    OR recipient_id IS NULL
  );
CREATE POLICY "Staff send dispatch notes" ON public.dispatch_messages
  FOR INSERT TO authenticated
  WITH CHECK (public.is_apex_staff(auth.uid()));

-- Storage: owner-scoped media, supervisors see everything
DROP POLICY IF EXISTS "Apex staff read fleet media" ON storage.objects;
DROP POLICY IF EXISTS "Apex staff upload fleet media" ON storage.objects;
DROP POLICY IF EXISTS "Apex staff update fleet media" ON storage.objects;
DROP POLICY IF EXISTS "Apex staff delete fleet media" ON storage.objects;

CREATE OR REPLACE FUNCTION public.owns_fleet_object(_bucket text, _name text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_dispatch_supervisor(auth.uid())
    OR (
      _bucket = 'driver-avatars'
      AND EXISTS (
        SELECT 1 FROM public.drivers d
        WHERE d.user_id = auth.uid() AND d.id::text = split_part(_name, '/', 1)
      )
    )
    OR (
      _bucket = 'proof-of-service'
      AND public.is_apex_staff(auth.uid())
      AND split_part(_name, '/', 1) = auth.uid()::text
    )
$$;
REVOKE ALL ON FUNCTION public.owns_fleet_object(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.owns_fleet_object(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.owns_fleet_object(text, text) TO authenticated, service_role;

CREATE POLICY "Owners read fleet media" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id IN ('proof-of-service', 'driver-avatars') AND public.owns_fleet_object(bucket_id, name));
CREATE POLICY "Owners upload fleet media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('proof-of-service', 'driver-avatars') AND public.owns_fleet_object(bucket_id, name));
CREATE POLICY "Owners update fleet media" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id IN ('proof-of-service', 'driver-avatars') AND public.owns_fleet_object(bucket_id, name))
  WITH CHECK (bucket_id IN ('proof-of-service', 'driver-avatars') AND public.owns_fleet_object(bucket_id, name));
CREATE POLICY "Owners delete fleet media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('proof-of-service', 'driver-avatars') AND public.owns_fleet_object(bucket_id, name));
