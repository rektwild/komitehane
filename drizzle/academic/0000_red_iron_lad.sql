CREATE TABLE "assessment_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version_id" uuid NOT NULL,
	"component_type" text NOT NULL,
	"position" smallint NOT NULL,
	"weight_percent" numeric(5, 2) NOT NULL,
	CONSTRAINT "component_position_unique" UNIQUE("version_id","component_type","position"),
	CONSTRAINT "component_type_check" CHECK ("assessment_components"."component_type" in ('COMMITTEE','MIDTERM','FINAL')),
	CONSTRAINT "component_weight_check" CHECK ("assessment_components"."weight_percent" > 0 and "assessment_components"."weight_percent" <= 100 and "assessment_components"."position" > 0)
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"course_code" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "courses_program_slug_unique" UNIQUE("program_id","slug"),
	CONSTRAINT "courses_program_id_unique" UNIQUE("program_id","id")
);
--> statement-breakpoint
CREATE TABLE "faculties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"university_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "faculties_university_slug_unique" UNIQUE("university_id","slug")
);
--> statement-breakpoint
CREATE TABLE "grading_rule_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version_id" uuid NOT NULL,
	"source_url" text NOT NULL,
	"source_type" text NOT NULL,
	"verified_at" timestamp with time zone NOT NULL,
	"source_title" text,
	"source_note" text
);
--> statement-breakpoint
CREATE TABLE "grading_scheme_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scheme_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"passing_grade" numeric(5, 2) NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"superseded_at" timestamp with time zone,
	"effective_from" timestamp with time zone,
	"effective_until" timestamp with time zone,
	"change_note" text,
	CONSTRAINT "version_scheme_number_unique" UNIQUE("scheme_id","version_number"),
	CONSTRAINT "version_status_check" CHECK ("grading_scheme_versions"."status" in ('DRAFT','PUBLISHED','SUPERSEDED')),
	CONSTRAINT "version_grade_check" CHECK ("grading_scheme_versions"."passing_grade" between 0 and 100 and "grading_scheme_versions"."version_number" > 0)
);
--> statement-breakpoint
CREATE TABLE "grading_schemes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"course_id" uuid,
	"academic_year_start" integer NOT NULL,
	"class_year" smallint NOT NULL,
	"period" text NOT NULL,
	"system_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scheme_course_system_check" CHECK (("grading_schemes"."system_type" = 'COMMITTEE' and "grading_schemes"."course_id" is null) or ("grading_schemes"."system_type" = 'MIDTERM' and "grading_schemes"."course_id" is not null)),
	CONSTRAINT "scheme_period_check" CHECK ("grading_schemes"."period" in ('ANNUAL','FALL','SPRING')),
	CONSTRAINT "scheme_year_check" CHECK ("grading_schemes"."academic_year_start" between 1900 and 2200 and "grading_schemes"."class_year" between 1 and 12)
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"faculty_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"duration_years" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "programs_faculty_slug_unique" UNIQUE("faculty_id","slug"),
	CONSTRAINT "program_duration_check" CHECK ("programs"."duration_years" between 1 and 12)
);
--> statement-breakpoint
CREATE TABLE "universities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"official_code" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "universities_slug_unique" UNIQUE("slug"),
	CONSTRAINT "universities_official_code_unique" UNIQUE("official_code")
);
--> statement-breakpoint
ALTER TABLE "assessment_components" ADD CONSTRAINT "assessment_components_version_id_grading_scheme_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."grading_scheme_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculties" ADD CONSTRAINT "faculties_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grading_rule_sources" ADD CONSTRAINT "grading_rule_sources_version_id_grading_scheme_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."grading_scheme_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grading_scheme_versions" ADD CONSTRAINT "grading_scheme_versions_scheme_id_grading_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."grading_schemes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grading_schemes" ADD CONSTRAINT "grading_schemes_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grading_schemes" ADD CONSTRAINT "scheme_course_program_fk" FOREIGN KEY ("program_id","course_id") REFERENCES "public"."courses"("program_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "grading_scheme_one_published_version" ON "grading_scheme_versions" USING btree ("scheme_id") WHERE "grading_scheme_versions"."status" = 'PUBLISHED';--> statement-breakpoint
CREATE UNIQUE INDEX "grading_schemes_committee_unique" ON "grading_schemes" USING btree ("program_id","academic_year_start","class_year","period") WHERE "grading_schemes"."system_type" = 'COMMITTEE';--> statement-breakpoint
CREATE UNIQUE INDEX "grading_schemes_midterm_unique" ON "grading_schemes" USING btree ("program_id","academic_year_start","class_year","period","course_id") WHERE "grading_schemes"."system_type" = 'MIDTERM';--> statement-breakpoint
CREATE FUNCTION academic_protect_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status <> 'DRAFT' THEN RAISE EXCEPTION 'published rule versions are immutable'; END IF;
    RETURN OLD;
  END IF;
  IF OLD.status <> 'DRAFT' AND NOT (
    OLD.status = 'PUBLISHED' AND NEW.status = 'SUPERSEDED'
    AND NEW.superseded_at IS NOT NULL
    AND (to_jsonb(NEW) - 'status' - 'superseded_at') = (to_jsonb(OLD) - 'status' - 'superseded_at')
  ) THEN
    RAISE EXCEPTION 'published rule versions are immutable';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER academic_protect_version_trigger BEFORE UPDATE OR DELETE ON grading_scheme_versions FOR EACH ROW EXECUTE FUNCTION academic_protect_version();
--> statement-breakpoint
CREATE FUNCTION academic_protect_version_children() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE old_status text; new_status text;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    SELECT status INTO old_status FROM grading_scheme_versions WHERE id=OLD.version_id FOR UPDATE;
    IF old_status IS DISTINCT FROM 'DRAFT' THEN RAISE EXCEPTION 'published rule data are immutable'; END IF;
  END IF;
  IF TG_OP <> 'DELETE' AND (TG_OP = 'INSERT' OR NEW.version_id IS DISTINCT FROM OLD.version_id) THEN
    SELECT status INTO new_status FROM grading_scheme_versions WHERE id=NEW.version_id FOR UPDATE;
    IF new_status IS DISTINCT FROM 'DRAFT' THEN RAISE EXCEPTION 'published rule data are immutable'; END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER academic_protect_components_trigger BEFORE INSERT OR UPDATE OR DELETE ON assessment_components FOR EACH ROW EXECUTE FUNCTION academic_protect_version_children();
--> statement-breakpoint
CREATE TRIGGER academic_protect_sources_trigger BEFORE INSERT OR UPDATE OR DELETE ON grading_rule_sources FOR EACH ROW EXECUTE FUNCTION academic_protect_version_children();
