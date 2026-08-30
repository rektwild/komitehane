import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // This migration is intentionally defensive. The initial migration was
  // already applied in some environments before the author model changed, and
  // old role columns were not present in every copy of that schema.
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typnamespace = 'public'::regnamespace
          AND typname = 'enum_users_role'
      ) THEN
        CREATE TYPE "public"."enum_users_role" AS ENUM('founder', 'editor', 'writer');
      END IF;
    END
    $$;

    ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "role" "public"."enum_users_role" DEFAULT 'writer';
    ALTER TABLE "media"
      ADD COLUMN IF NOT EXISTS "uploaded_by_id" integer;
    ALTER TABLE "articles"
      ADD COLUMN IF NOT EXISTS "author_id" integer;
    ALTER TABLE "_articles_v"
      ADD COLUMN IF NOT EXISTS "version_author_id" integer;
  `)

  // Existing users become writers first so that the default is valid for every
  // row; the oldest existing account is then promoted to Founder.
  await db.execute(sql`
    DO $$
    DECLARE
      first_user_id integer;
    BEGIN
      UPDATE "users"
      SET "role" = 'writer'
      WHERE "role" IS NULL;

      SELECT "id"
      INTO first_user_id
      FROM "users"
      ORDER BY "id"
      LIMIT 1;

      IF first_user_id IS NOT NULL THEN
        UPDATE "users"
        SET "role" = 'founder'
        WHERE "id" = first_user_id;
      END IF;

      ALTER TABLE "users"
        ALTER COLUMN "role" SET DEFAULT 'writer';
      ALTER TABLE "users"
        ALTER COLUMN "role" SET NOT NULL;
    END
    $$;
  `)

  // Match legacy author names exactly. A non-null value that maps to zero or
  // multiple users is unsafe to migrate, while a null draft author remains
  // intentionally writerless.
  await db.execute(sql`
    DO $$
    DECLARE
      has_author_name boolean;
      unmatched_count bigint;
    BEGIN
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'articles'
          AND column_name = 'author_name'
      )
      INTO has_author_name;

      IF has_author_name THEN
        EXECUTE $query$
          SELECT count(*)
          FROM "articles" AS article
          WHERE article."author_id" IS NULL
            AND article."author_name" IS NOT NULL
            AND (
              SELECT count(*)
              FROM "users" AS user_record
              WHERE user_record."name" = article."author_name"
            ) <> 1
        $query$
        INTO unmatched_count;

        IF unmatched_count > 0 THEN
          RAISE EXCEPTION
            'Cannot migrate articles: % author_name values do not match exactly one user.',
            unmatched_count;
        END IF;

        EXECUTE $query$
          UPDATE "articles" AS article
          SET "author_id" = user_record."id"
          FROM "users" AS user_record
          WHERE article."author_id" IS NULL
            AND article."author_name" IS NOT NULL
            AND user_record."name" = article."author_name"
            AND (
              SELECT count(*)
              FROM "users" AS matched_user
              WHERE matched_user."name" = article."author_name"
            ) = 1
        $query$;
      END IF;

      SELECT count(*)
      INTO unmatched_count
      FROM "articles"
      WHERE "_status" = 'published'
        AND "author_id" IS NULL;

      IF unmatched_count > 0 THEN
        RAISE EXCEPTION
          'Cannot migrate articles: % published records have no author.',
          unmatched_count;
      END IF;
    END
    $$;
  `)

  // Versions use Payload's version_* column naming. Prefer their legacy
  // author_name value, then inherit the live article author for old versions
  // that had no author value of their own.
  await db.execute(sql`
    DO $$
    DECLARE
      has_version_author_name boolean;
      has_version_status boolean;
      unmatched_count bigint;
    BEGIN
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = '_articles_v'
          AND column_name = 'version_author_name'
      )
      INTO has_version_author_name;

      IF has_version_author_name THEN
        EXECUTE $query$
          SELECT count(*)
          FROM "_articles_v" AS version_record
          WHERE version_record."version_author_id" IS NULL
            AND version_record."version_author_name" IS NOT NULL
            AND (
              SELECT count(*)
              FROM "users" AS user_record
              WHERE user_record."name" = version_record."version_author_name"
            ) <> 1
        $query$
        INTO unmatched_count;

        IF unmatched_count > 0 THEN
          RAISE EXCEPTION
            'Cannot migrate article versions: % author values do not match exactly one user.',
            unmatched_count;
        END IF;

        EXECUTE $query$
          UPDATE "_articles_v" AS version_record
          SET "version_author_id" = user_record."id"
          FROM "users" AS user_record
          WHERE version_record."version_author_id" IS NULL
            AND version_record."version_author_name" IS NOT NULL
            AND user_record."name" = version_record."version_author_name"
            AND (
              SELECT count(*)
              FROM "users" AS matched_user
              WHERE matched_user."name" = version_record."version_author_name"
            ) = 1
        $query$;
      END IF;

      UPDATE "_articles_v" AS version_record
      SET "version_author_id" = article."author_id"
      FROM "articles" AS article
      WHERE version_record."version_author_id" IS NULL
        AND version_record."parent_id" = article."id"
        AND article."author_id" IS NOT NULL;

      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = '_articles_v'
          AND column_name = 'version__status'
      )
      INTO has_version_status;

      IF has_version_status THEN
        EXECUTE $query$
          SELECT count(*)
          FROM "_articles_v"
          WHERE "version__status" = 'published'
            AND "version_author_id" IS NULL
        $query$
        INTO unmatched_count;

        IF unmatched_count > 0 THEN
          RAISE EXCEPTION
            'Cannot migrate article versions: % published records have no author.',
            unmatched_count;
        END IF;
      END IF;
    END
    $$;
  `)

  // The existing media records have no owner column, so assign them to the
  // first account. New uploads are assigned by the collection hook.
  await db.execute(sql`
    DO $$
    DECLARE
      first_user_id integer;
      missing_count bigint;
    BEGIN
      SELECT "id"
      INTO first_user_id
      FROM "users"
      ORDER BY "id"
      LIMIT 1;

      SELECT count(*)
      INTO missing_count
      FROM "media"
      WHERE "uploaded_by_id" IS NULL;

      IF missing_count > 0 AND first_user_id IS NULL THEN
        RAISE EXCEPTION
          'Cannot migrate media: % records need an owner but no user exists.',
          missing_count;
      END IF;

      UPDATE "media"
      SET "uploaded_by_id" = first_user_id
      WHERE "uploaded_by_id" IS NULL;
    END
    $$;

    ALTER TABLE "media"
      ALTER COLUMN "uploaded_by_id" SET NOT NULL;
  `)

  // Relationship foreign keys and indexes use Payload's native names and
  // default ON DELETE behavior. User deletion is additionally blocked by the
  // Users beforeDelete hook, while this preserves native schema generation.
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'media_uploaded_by_id_users_id_fk'
      ) THEN
        ALTER TABLE "media"
          ADD CONSTRAINT "media_uploaded_by_id_users_id_fk"
          FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id")
          ON DELETE set null ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'articles_author_id_users_id_fk'
      ) THEN
        ALTER TABLE "articles"
          ADD CONSTRAINT "articles_author_id_users_id_fk"
          FOREIGN KEY ("author_id") REFERENCES "public"."users"("id")
          ON DELETE set null ON UPDATE no action;
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = '_articles_v_version_author_id_users_id_fk'
      ) THEN
        ALTER TABLE "_articles_v"
          ADD CONSTRAINT "_articles_v_version_author_id_users_id_fk"
          FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id")
          ON DELETE set null ON UPDATE no action;
      END IF;
    END
    $$;

    CREATE INDEX IF NOT EXISTS "media_uploaded_by_idx"
      ON "media" USING btree ("uploaded_by_id");
    CREATE INDEX IF NOT EXISTS "articles_author_idx"
      ON "articles" USING btree ("author_id");
    CREATE INDEX IF NOT EXISTS "_articles_v_version_version_author_idx"
      ON "_articles_v" USING btree ("version_author_id");
  `)

  // Drop legacy fields only after every value that can be preserved has been
  // validated and copied into the relationship columns.
  await db.execute(sql`
    ALTER TABLE "articles"
      DROP COLUMN IF EXISTS "author_name",
      DROP COLUMN IF EXISTS "author_role",
      DROP COLUMN IF EXISTS "is_trending",
      DROP COLUMN IF EXISTS "trending_order",
      DROP COLUMN IF EXISTS "is_popular",
      DROP COLUMN IF EXISTS "popular_order";

    ALTER TABLE "_articles_v"
      DROP COLUMN IF EXISTS "version_author_name",
      DROP COLUMN IF EXISTS "version_author_role",
      DROP COLUMN IF EXISTS "version__author_role",
      DROP COLUMN IF EXISTS "version_is_trending",
      DROP COLUMN IF EXISTS "version_trending_order",
      DROP COLUMN IF EXISTS "version_is_popular",
      DROP COLUMN IF EXISTS "version_popular_order";

    DROP TYPE IF EXISTS "public"."enum_articles_author_role";
    DROP TYPE IF EXISTS "public"."enum__articles_v_version_author_role";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "media"
      DROP CONSTRAINT IF EXISTS "media_uploaded_by_id_users_id_fk";
    ALTER TABLE "articles"
      DROP CONSTRAINT IF EXISTS "articles_author_id_users_id_fk";
    ALTER TABLE "_articles_v"
      DROP CONSTRAINT IF EXISTS "_articles_v_version_author_id_users_id_fk";

    DROP INDEX IF EXISTS "media_uploaded_by_idx";
    DROP INDEX IF EXISTS "articles_author_idx";
    DROP INDEX IF EXISTS "_articles_v_version_version_author_idx";

    ALTER TABLE "articles"
      ADD COLUMN IF NOT EXISTS "author_name" varchar,
      ADD COLUMN IF NOT EXISTS "is_trending" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "trending_order" numeric DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "is_popular" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "popular_order" numeric DEFAULT 0;
    ALTER TABLE "_articles_v"
      ADD COLUMN IF NOT EXISTS "version_author_name" varchar,
      ADD COLUMN IF NOT EXISTS "version_is_trending" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "version_trending_order" numeric DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "version_is_popular" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "version_popular_order" numeric DEFAULT 0;

    UPDATE "articles" AS article
    SET "author_name" = user_record."name"
    FROM "users" AS user_record
    WHERE article."author_id" = user_record."id";
    UPDATE "_articles_v" AS version_record
    SET "version_author_name" = user_record."name"
    FROM "users" AS user_record
    WHERE version_record."version_author_id" = user_record."id";

    ALTER TABLE "media"
      DROP COLUMN IF EXISTS "uploaded_by_id";
    ALTER TABLE "articles"
      DROP COLUMN IF EXISTS "author_id";
    ALTER TABLE "_articles_v"
      DROP COLUMN IF EXISTS "version_author_id";
    ALTER TABLE "users"
      DROP COLUMN IF EXISTS "role";

    DROP TYPE IF EXISTS "public"."enum_users_role";
  `)
}
