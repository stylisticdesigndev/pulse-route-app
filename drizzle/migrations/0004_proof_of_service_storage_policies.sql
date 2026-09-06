CREATE POLICY "Authenticated users upload proof of service"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'proof-of-service');

CREATE POLICY "Authenticated users view proof of service"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'proof-of-service');

CREATE POLICY "Demo access proof of service"
ON storage.objects FOR ALL
TO anon
USING (bucket_id = 'proof-of-service')
WITH CHECK (bucket_id = 'proof-of-service');
