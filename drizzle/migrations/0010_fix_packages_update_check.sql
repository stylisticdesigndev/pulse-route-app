DROP POLICY IF EXISTS "Assigned drivers update packages" ON public.packages;
CREATE POLICY "Assigned drivers update packages" ON public.packages
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stops s LEFT JOIN public.routes r ON r.id = s.route_id
    WHERE s.id = packages.stop_id
      AND (r.driver_id = auth.uid() OR public.is_dispatch_supervisor(auth.uid()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stops s LEFT JOIN public.routes r ON r.id = s.route_id
    WHERE s.id = packages.stop_id
      AND (r.driver_id = auth.uid() OR public.is_dispatch_supervisor(auth.uid()))
  ));
