ALTER TABLE "meetings" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "tags" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "transcript" text;--> statement-breakpoint
ALTER TABLE "transcripts" ADD COLUMN "text_embeddings" text;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;



DROP POLICY IF EXISTS "Allow authenticated users to upload recordings" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to read recordings" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to update recordings" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to delete recordings" ON storage.objects;

  -- Allow authenticated users to upload
  CREATE POLICY "Allow authenticated users to upload recordings"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'recordings' AND (storage.foldername(name))[1] = 'meeting-recordings');

  -- Allow authenticated users to read
  CREATE POLICY "Allow authenticated users to read recordings"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'recordings' AND (storage.foldername(name))[1] = 'meeting-recordings');

  -- Allow authenticated users to update
  CREATE POLICY "Allow authenticated users to update recordings"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'recordings' AND (storage.foldername(name))[1] = 'meeting-recordings')
  WITH CHECK (bucket_id = 'recordings' AND (storage.foldername(name))[1] = 'meeting-recordings');

  -- Allow authenticated users to delete
  CREATE POLICY "Allow authenticated users to delete recordings"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'recordings' AND (storage.foldername(name))[1] = 'meeting-recordings');

  -- Allow public to read (for playback)
  CREATE POLICY "Allow public to read recordings"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'recordings');