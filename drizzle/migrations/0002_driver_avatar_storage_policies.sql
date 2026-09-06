CREATE POLICY "demo read driver avatars" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'driver-avatars');
CREATE POLICY "demo insert driver avatars" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'driver-avatars');
CREATE POLICY "demo update driver avatars" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'driver-avatars') WITH CHECK (bucket_id = 'driver-avatars');
CREATE POLICY "demo delete driver avatars" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'driver-avatars');