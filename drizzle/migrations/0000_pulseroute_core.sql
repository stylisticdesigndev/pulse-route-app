-- Shifts
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_name TEXT NOT NULL,
  driver_code TEXT NOT NULL,
  manifest_code TEXT NOT NULL,
  vehicle TEXT NOT NULL,
  odometer_start NUMERIC,
  odometer_end NUMERIC,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active'
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shifts TO anon, authenticated;
GRANT ALL ON public.shifts TO service_role;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo full access shifts" ON public.shifts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Stops
CREATE TABLE public.stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seq INTEGER NOT NULL,
  recipient TEXT NOT NULL,
  address TEXT NOT NULL,
  sector TEXT,
  phone TEXT,
  window_start TEXT NOT NULL,
  window_end TEXT NOT NULL,
  eta TEXT,
  distance_km NUMERIC NOT NULL DEFAULT 0,
  gate_code TEXT,
  hazard_warning TEXT,
  drop_instruction TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stops TO anon, authenticated;
GRANT ALL ON public.stops TO service_role;
ALTER TABLE public.stops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo full access stops" ON public.stops FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Packages
CREATE TABLE public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stop_id UUID NOT NULL REFERENCES public.stops(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  kind TEXT NOT NULL,
  description TEXT,
  weight_lbs NUMERIC,
  scanned BOOLEAN NOT NULL DEFAULT false
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.packages TO anon, authenticated;
GRANT ALL ON public.packages TO service_role;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo full access packages" ON public.packages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Delivery events (proof of service / exceptions / reroutes)
CREATE TABLE public.delivery_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stop_id UUID REFERENCES public.stops(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  reason TEXT,
  signature_path TEXT,
  photo_captured BOOLEAN NOT NULL DEFAULT false,
  proximity_m INTEGER,
  gps TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_events TO anon, authenticated;
GRANT ALL ON public.delivery_events TO service_role;
ALTER TABLE public.delivery_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo full access events" ON public.delivery_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Seed manifest RT-8842
INSERT INTO public.stops (seq, recipient, address, sector, phone, window_start, window_end, eta, distance_km, gate_code, hazard_warning, drop_instruction, status) VALUES
(1, 'Priya Nandakumar', '18 Larkspur Way', 'Sector 4A', '+1 555 0141', '13:10', '13:40', '13:22', 0.8, NULL, NULL, 'Hand to reception desk', 'completed'),
(2, 'Sarah Jenkins', '905 Foxglove Lane', 'Sector 5C', '+1 555 0177', '13:45', '14:10', '14:02', 1.6, '#8801', NULL, 'Leave inside screen door', 'completed'),
(3, 'Dr. Aris Thorne', '55 Halcyon Medical Plaza', 'Sector 6B', '+1 555 0192', '14:00', '14:20', '14:18', 2.0, NULL, NULL, 'Signature required at pharmacy counter', 'completed'),
(4, 'Marcus Vance', '742 Evergreen Terrace', 'Sector 7G', '+1 555 0134', '14:15', '14:45', '14:35', 2.4, '#1224', 'Large dog on premises in backyard', 'Leave under covered porch beside blue bench', 'in_transit'),
(5, 'Elena Rostov', '128 Oakridge Blvd', 'Sector 7H', '+1 555 0166', '14:50', '15:20', '15:04', 4.1, NULL, NULL, 'Buzz unit 12B', 'pending'),
(6, 'Tobias Fenn', '3 Winterline Court', 'Sector 8A', '+1 555 0118', '15:25', '15:55', '15:38', 6.3, '#4409', 'Steep gravel driveway', 'Garage side door', 'pending'),
(7, 'Halcyon Dental Group', '2201 Meridian Ave, Suite 300', 'Sector 8C', '+1 555 0125', '16:00', '16:30', '16:11', 8.0, NULL, NULL, 'Deliver to suite 300 front desk', 'pending'),
(8, 'Nadia Okonkwo', '67 Bramble Hollow', 'Sector 9D', '+1 555 0159', '16:40', '17:10', '16:52', 10.4, NULL, NULL, 'Photo proof required at door', 'pending');

INSERT INTO public.packages (stop_id, code, kind, description, weight_lbs, scanned)
SELECT s.id, 'RT-8842-A', 'Medium Box', 'Priority Healthcare Supplies', 2.8, true FROM public.stops s WHERE s.seq = 4;
INSERT INTO public.packages (stop_id, code, kind, description, weight_lbs, scanned)
SELECT s.id, 'RT-8842-B', 'Poly Mailer', 'Standard Delivery', 0.6, false FROM public.stops s WHERE s.seq = 4;
INSERT INTO public.packages (stop_id, code, kind, description, weight_lbs, scanned)
SELECT s.id, 'RT-8842-C', 'Small Box', 'Retail Fulfilment', 1.4, false FROM public.stops s WHERE s.seq = 5;
INSERT INTO public.packages (stop_id, code, kind, description, weight_lbs, scanned)
SELECT s.id, 'RT-8842-D', 'Large Box', 'Household Goods', 12.2, false FROM public.stops s WHERE s.seq = 6;
INSERT INTO public.packages (stop_id, code, kind, description, weight_lbs, scanned)
SELECT s.id, 'RT-8842-E', 'Document Envelope', 'Legal Documents', 0.3, false FROM public.stops s WHERE s.seq = 7;
INSERT INTO public.packages (stop_id, code, kind, description, weight_lbs, scanned)
SELECT s.id, 'RT-8842-F', 'Poly Mailer', 'Standard Delivery', 0.9, false FROM public.stops s WHERE s.seq = 8;
