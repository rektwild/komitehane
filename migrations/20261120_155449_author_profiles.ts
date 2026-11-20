import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "users_locales" (
  	"bio" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "users" ADD COLUMN "slug" varchar;
  WITH normalized AS (
    SELECT "id",
      trim(both '-' from regexp_replace(
        lower(translate(coalesce("name", ''), 'çğıöşüÇĞİÖŞÜâêîôûÂÊÎÔÛ', 'cgiosucgiosuaeiouaeiou')),
        '[^a-z0-9]+', '-', 'g'
      )) AS "base"
    FROM "users"
  ), ranked AS (
    SELECT "id", "base", row_number() OVER (PARTITION BY "base" ORDER BY "id") AS "rn"
    FROM normalized
  )
  UPDATE "users" AS u SET "slug" = CASE
    WHEN r."base" = '' THEN 'author-' || u."id"
    WHEN r."rn" = 1 THEN left(r."base", 96)
    ELSE left(r."base", 90) || '-' || u."id"
  END
  FROM ranked AS r
  WHERE r."id" = u."id" AND u."slug" IS NULL;
  ALTER TABLE "users_locales" ADD CONSTRAINT "users_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "users_locales_locale_parent_id_unique" ON "users_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "users_slug_idx" ON "users" USING btree ("slug");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "users_locales" CASCADE;
  DROP INDEX "users_slug_idx";
  ALTER TABLE "users" DROP COLUMN "slug";`)
}
