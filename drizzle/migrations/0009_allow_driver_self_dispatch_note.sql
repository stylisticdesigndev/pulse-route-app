CREATE POLICY "Drivers log notes addressed to themselves" ON public.dispatch_messages
  FOR INSERT TO authenticated
  WITH CHECK (recipient_id = auth.uid() AND public.is_apex_staff(auth.uid()));
