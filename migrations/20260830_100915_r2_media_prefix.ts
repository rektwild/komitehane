import {MigrateDownArgs, MigrateUpArgs, sql} from "@payloadcms/db-postgres";

export async function up({db}: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "prefix" varchar;
    ALTER TABLE "media" ALTER COLUMN "prefix" SET DEFAULT 'news';
    UPDATE "media" SET "prefix" = 'news' WHERE "prefix" IS NULL;
  `);
}

export async function down({db}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "media" DROP COLUMN IF EXISTS "prefix";
  `);
}
