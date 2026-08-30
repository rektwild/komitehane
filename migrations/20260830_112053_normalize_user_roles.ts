import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    DECLARE
      role_type text;
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM "users"
        WHERE "role" IS NOT NULL
          AND lower("role"::text) NOT IN ('founder', 'editor', 'writer')
      ) THEN
        RAISE EXCEPTION 'users.role contains a value outside founder, editor, writer';
      END IF;

      SELECT "udt_name"
      INTO role_type
      FROM "information_schema"."columns"
      WHERE "table_schema" = 'public'
        AND "table_name" = 'users'
        AND "column_name" = 'role';

      IF role_type = 'enum_users_role' THEN
        UPDATE "users"
        SET "role" = lower("role"::text)::"public"."enum_users_role"
        WHERE "role" IS NOT NULL;
      ELSE
        UPDATE "users"
        SET "role" = lower("role"::text)
        WHERE "role" IS NOT NULL;
      END IF;
    END
    $$;

    ALTER TABLE "users"
      ALTER COLUMN "role" SET DEFAULT 'writer';
    ALTER TABLE "users"
      ALTER COLUMN "role" SET NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  void db
}
