import {postgresAdapter} from "@payloadcms/db-postgres";
import {lexicalEditor} from "@payloadcms/richtext-lexical";
import {vercelBlobStorage} from "@payloadcms/storage-vercel-blob";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {buildConfig} from "payload";
import sharp from "sharp";

import {Articles} from "@/collections/Articles";
import {Categories} from "@/collections/Categories";
import {Media} from "@/collections/Media";
import {Users} from "@/collections/Users";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: dirname,
    },
  },
  collections: [Users, Media, Categories, Articles],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "",
    },
  }),
  editor: lexicalEditor(),
  localization: {
    locales: [
      {code: "tr", label: "Türkçe"},
      {code: "en", label: "English"},
    ],
    defaultLocale: "tr",
    fallback: false,
  },
  plugins: [
    vercelBlobStorage({
      collections: {
        media: {
          prefix: "news",
        },
      },
      clientUploads: true,
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
  secret: process.env.PAYLOAD_SECRET || "",
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
