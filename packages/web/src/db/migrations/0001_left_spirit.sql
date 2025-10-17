CREATE TYPE "public"."docuseal_event" AS ENUM('template.created', 'template.updated', 'form.viewed', 'form.started', 'form.completed', 'form.declined', 'submission.created', 'submission.completed');--> statement-breakpoint
CREATE TABLE "docuseal_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"template_id" integer,
	"submission_id" integer,
	"template_slug" varchar(100),
	"submission_slug" varchar(100),
	"event_type" "docuseal_event" NOT NULL,
	"event_data" jsonb DEFAULT '{}',
	"document_name" varchar(255),
	"signed_document_url" text,
	"audit_log_url" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "docuseal_tracking" ADD CONSTRAINT "docuseal_tracking_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "docuseal_tracking" ADD CONSTRAINT "docuseal_tracking_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;