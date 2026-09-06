CREATE OR REPLACE FUNCTION public.is_apex_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id
      AND role IN ('field_technician'::public.user_role, 'dispatch_supervisor'::public.user_role)
  )
$$;

REVOKE ALL ON FUNCTION public.is_apex_staff(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_apex_staff(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_apex_staff(uuid) TO authenticated, service_role;
