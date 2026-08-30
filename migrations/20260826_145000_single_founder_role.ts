import {MigrateDownArgs, MigrateUpArgs, sql} from "@payloadcms/db-postgres";

export async function up({db}: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    DECLARE
      first_user_id integer;
    BEGIN
      SELECT "id"
      INTO first_user_id
      FROM "users"
      ORDER BY "id"
      LIMIT 1;

      IF first_user_id IS NOT NULL THEN
        UPDATE "users"
        SET "role" = 'writer'
        WHERE "role" = 'founder'
          AND "id" <> first_user_id;

        UPDATE "users"
        SET "role" = 'founder'
        WHERE "id" = first_user_id;
      END IF;
    END
    $$;
  `);
}

export async function down({db}: MigrateDownArgs): Promise<void> {
  // The data invariant is intentionally not reversed. The previous migration
  // already established the role column and the first account as Founder.
  void db;
}
