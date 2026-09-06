DROP POLICY IF EXISTS "Drivers update own dispatch messages" ON public.dispatch_messages;
CREATE POLICY "Drivers update messages addressed to them" ON public.dispatch_messages
  FOR UPDATE TO authenticated
  USING (public.is_dispatch_supervisor(auth.uid()) OR recipient_id = auth.uid())
  WITH CHECK (
    public.is_dispatch_supervisor(auth.uid())
    OR (recipient_id = auth.uid())
  );

-- Drivers mark fleet broadcasts as read through a controlled procedure only
CREATE OR REPLACE FUNCTION public.mark_dispatch_messages_read()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_apex_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Only Apex staff can mark dispatch messages read';
  END IF;
  UPDATE public.dispatch_messages
     SET read = true
   WHERE read = false
     AND (recipient_id IS NULL OR recipient_id = auth.uid());
END;
$$;
REVOKE ALL ON FUNCTION public.mark_dispatch_messages_read() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_dispatch_messages_read() FROM anon;
GRANT EXECUTE ON FUNCTION public.mark_dispatch_messages_read() TO authenticated, service_role;
