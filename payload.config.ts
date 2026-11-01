import {postgresAdapter} from "@payloadcms/db-postgres";
import {BlocksFeature, lexicalEditor} from "@payloadcms/richtext-lexical";
import {s3Storage} from "@payloadcms/storage-s3";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {buildConfig} from "payload";
import sharp from "sharp";

import {Articles} from "@/collections/Articles";
import {Categories} from "@/collections/Categories";
import {Media} from "@/collections/Media";
import {Tags} from "@/collections/Tags";
import {Users} from "@/collections/Users";
import {ArticleImageBlock} from "@/blocks/article-image";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const r2Environment = {
  bucket: process.env.R2_BUCKET?.trim(),
  accessKeyId: process.env.R2_ACCESS_KEY_ID?.trim(),
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY?.trim(),
  endpoint: process.env.R2_ENDPOINT?.trim(),
  publicUrl: process.env.R2_PUBLIC_URL?.trim(),
};

const hasAnyR2Environment = Object.values(r2Environment).some(Boolean);
const hasCompleteR2Environment = Object.values(r2Environment).every(Boolean);
const hostedDeployment = ["preview", "production", "staging"].includes(
  process.env.VERCEL_ENV || process.env.DEPLOYMENT_ENV || "",
);

if ((hasAnyR2Environment && !hasCompleteR2Environment) || (hostedDeployment && !hasCompleteR2Environment)) {
  throw new Error(
    "Cloudflare R2 requires R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, and R2_PUBLIC_URL.",
  );
}

const r2PublicUrl = r2Environment.publicUrl?.replace(/\/+$/u, "");

if (hasCompleteR2Environment && r2PublicUrl) {
  let parsedPublicUrl: URL;

  try {
    parsedPublicUrl = new URL(r2PublicUrl);
  } catch {
    throw new Error("R2_PUBLIC_URL must be a valid absolute URL.");
  }

  if (
    parsedPublicUrl.protocol !== "https:" ||
    parsedPublicUrl.pathname !== "/" ||
    parsedPublicUrl.search ||
    parsedPublicUrl.hash
  ) {
    throw new Error("R2_PUBLIC_URL must be an HTTPS origin without a path, query, or hash.");
  }

  const mediaHostname = process.env.NEXT_PUBLIC_MEDIA_HOSTNAME?.trim().toLowerCase();
  if (!mediaHostname || mediaHostname !== parsedPublicUrl.hostname.toLowerCase()) {
    throw new Error("NEXT_PUBLIC_MEDIA_HOSTNAME must match the hostname in R2_PUBLIC_URL.");
  }
}

// Only trust the private PostgreSQL certificate when targeting the Oracle database.
// Keep the existing Neon connection behavior unchanged until the final cutover.
const databaseUrl = process.env.DATABASE_URL || "";
const oracleDatabaseHostname = "blog-db.komitehane.com";
let oracleDatabaseSsl:
  | {ca: string; rejectUnauthorized: true; servername: string}
  | undefined;

if (databaseUrl) {
  const parsedDatabaseUrl = new URL(databaseUrl);

  if (parsedDatabaseUrl.hostname.toLowerCase() === oracleDatabaseHostname) {
    // node-postgres discards a separately supplied ssl object if these
    // connection-string parameters are present.
    const conflictingSslOptions = ["sslmode", "sslcert", "sslkey", "sslrootcert"];
    if (conflictingSslOptions.some((option) => parsedDatabaseUrl.searchParams.has(option))) {
      throw new Error(
        "Remove sslmode, sslcert, sslkey and sslrootcert from the Oracle DATABASE_URL; TLS is configured in payload.config.ts.",
      );
    }

    const encodedCertificate = process.env.POSTGRES_CA_CERT_BASE64?.trim();
    if (!encodedCertificate) {
      throw new Error("POSTGRES_CA_CERT_BASE64 is required for the Oracle PostgreSQL connection.");
    }

    const certificate = Buffer.from(encodedCertificate, "base64").toString("utf8").trim();
    if (
      !certificate.startsWith("-----BEGIN CERTIFICATE-----") ||
      !certificate.endsWith("-----END CERTIFICATE-----")
    ) {
      throw new Error("POSTGRES_CA_CERT_BASE64 must contain a Base64-encoded PEM certificate.");
    }

    oracleDatabaseSsl = {
      ca: certificate,
      rejectUnauthorized: true,
      servername: oracleDatabaseHostname,
    };
  }
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: dirname,
    },
  },
  collections: [Users, Media, Categories, Tags, Articles],
  db: postgresAdapter({
    pool: {
      connectionString: databaseUrl,
      ...(oracleDatabaseSsl ? {ssl: oracleDatabaseSsl} : {}),
    },
  }),
  editor: lexicalEditor({
    features: ({defaultFeatures}) => [
      ...defaultFeatures,
      BlocksFeature({blocks: [ArticleImageBlock]}),
    ],
  }),
  localization: {
    locales: [
      {code: "tr", label: "Türkçe"},
      {code: "en", label: "English"},
    ],
    defaultLocale: "tr",
    fallback: false,
  },
  plugins: [
    s3Storage({
      alwaysInsertFields: true,
      collections: {
        media: {
          prefix: "news",
          disablePayloadAccessControl: true,
          generateFileURL: ({filename, prefix}) => {
            if (!r2PublicUrl) {
              throw new Error("R2_PUBLIC_URL is required to generate media URLs.");
            }

            const key = prefix ? `${prefix}/${filename}` : filename;
            return `${r2PublicUrl}/${key}`;
          },
        },
      },
      clientUploads: true,
      enabled: hasCompleteR2Environment,
      bucket: r2Environment.bucket ?? "",
      config: {
        credentials: {
          accessKeyId: r2Environment.accessKeyId ?? "",
          secretAccessKey: r2Environment.secretAccessKey ?? "",
        },
        region: "auto",
        endpoint: r2Environment.endpoint ?? "",
        forcePathStyle: true,
      },
    }),
  ],
  secret: process.env.PAYLOAD_SECRET || "",
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
