-- Storage policies para project-photos (mismo patrón que mini-photos)
CREATE POLICY "Public read project-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-photos');

CREATE POLICY "Authenticated upload project-photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'project-photos');

CREATE POLICY "Authenticated update project-photos" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'project-photos');

CREATE POLICY "Authenticated delete project-photos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'project-photos');
