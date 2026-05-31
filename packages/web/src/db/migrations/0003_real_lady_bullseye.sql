CREATE TYPE "public"."transcript_status" AS ENUM('pending', 'processing', 'done', 'failed');--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "transcript_status" "transcript_status" DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "processing_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "transcripts" DROP COLUMN "text_embeddings";