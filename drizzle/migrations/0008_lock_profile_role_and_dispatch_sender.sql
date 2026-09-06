CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS public.user_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;
REVOKE ALL ON FUNCTION public.current_profile_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_profile_role() FROM anon;
GRANT EXECUTE ON FUNCTION public.current_profile_role() TO authenticated, service_role;

DROP POLICY IF EXISTS "Staff update own profile" ON public.profiles;
CREATE POLICY "Staff update own profile without role change" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (
      role = public.current_profile_role()
      OR public.is_dispatch_supervisor(auth.uid())
    )
  );

-- Only dispatch supervisors may originate dispatch messages
DROP POLICY IF EXISTS "Staff send dispatch notes" ON public.dispatch_messages;
CREATE POLICY "Supervisors send dispatch notes" ON public.dispatch_messages
  FOR INSERT TO authenticated
  WITH CHECK (public.is_dispatch_supervisor(auth.uid()));
