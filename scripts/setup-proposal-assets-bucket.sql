-- Create proposal-assets bucket for storing images uploaded in proposal editors
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposal-assets', 'proposal-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: operators can upload to their own folders
CREATE POLICY "Operators can upload to their folders"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'proposal-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: anyone can view (public bucket)
CREATE POLICY "Anyone can view proposal assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'proposal-assets');

-- RLS: operators can delete their own files
CREATE POLICY "Operators can delete their files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'proposal-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
