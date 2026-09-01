import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_media_source_provider" AS ENUM('pexels');
  ALTER TABLE "media" ADD COLUMN "source_provider" "enum_media_source_provider";
  ALTER TABLE "media" ADD COLUMN "source_photo_id" varchar;
  ALTER TABLE "media" ADD COLUMN "source_page_url" varchar;
  ALTER TABLE "media" ADD COLUMN "photographer_name" varchar;
  ALTER TABLE "media" ADD COLUMN "photographer_url" varchar;
  CREATE INDEX "media_source_photo_id_idx" ON "media" USING btree ("source_photo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "media_source_photo_id_idx";
  ALTER TABLE "media" DROP COLUMN "source_provider";
  ALTER TABLE "media" DROP COLUMN "source_photo_id";
  ALTER TABLE "media" DROP COLUMN "source_page_url";
  ALTER TABLE "media" DROP COLUMN "photographer_name";
  ALTER TABLE "media" DROP COLUMN "photographer_url";
  DROP TYPE "public"."enum_media_source_provider";`)
}
