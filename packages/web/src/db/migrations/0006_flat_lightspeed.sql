CREATE TABLE "saved_research" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"query" text NOT NULL,
	"answer" text NOT NULL,
	"sources" jsonb DEFAULT '[]' NOT NULL,
	"related_queries" text[] DEFAULT '{}',
	"title" varchar(255),
	"tags" varchar[] DEFAULT '{}',
	"notes" text,
	"confidence" varchar(10) DEFAULT '0.95',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "saved_research" ADD CONSTRAINT "saved_research_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_research" ADD CONSTRAINT "saved_research_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;