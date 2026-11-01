import {spawnSync} from "node:child_process";
import fs from "node:fs";

const readEnvFileValue = (key) => {
  for (const filename of [".env.local", ".env"]) {
    const filepath = `${process.cwd()}/${filename}`;

    if (!fs.existsSync(filepath)) continue;

    const line = fs
      .readFileSync(filepath, "utf8")
      .split(/\r?\n/)
      .find((entry) => entry.startsWith(`${key}=`));

    if (!line) continue;

    return line
      .slice(key.length + 1)
      .trim()
      .replace(/^(['"])(.*)\1$/, "$2");
  }

  return undefined;
};

const migrationDatabaseUrl =
  process.env.DATABASE_URL_UNPOOLED ||
  readEnvFileValue("DATABASE_URL_UNPOOLED") ||
  process.env.DATABASE_URL ||
  readEnvFileValue("DATABASE_URL");

if (!migrationDatabaseUrl) {
  console.error(
    "DATABASE_URL_UNPOOLED or DATABASE_URL is required to run Payload migrations.",
  );
  process.exit(1);
}

// Oracle PostgreSQL migrations are managed separately from Vercel builds.
// Runtime uses the restricted komitehane_payload login, which must not own tables
// or perform schema changes. Existing migrations were applied during the import.
const runtimeDatabaseUrl =
  process.env.DATABASE_URL || readEnvFileValue("DATABASE_URL");
const oracleDatabaseHostname = "blog-db.komitehane.com";

if (
  process.env.VERCEL &&
  runtimeDatabaseUrl &&
  new URL(runtimeDatabaseUrl).hostname.toLowerCase() === oracleDatabaseHostname
) {
  if (new URL(migrationDatabaseUrl).hostname.toLowerCase() !== oracleDatabaseHostname) {
    console.error(
      "DATABASE_URL_UNPOOLED must also point to Oracle when DATABASE_URL uses Oracle; refusing a mixed-database build.",
    );
    process.exit(1);
  }

  console.log(
    "Skipping automatic Payload migrations for Oracle on Vercel. Apply future migrations with a separately authorized schema-owner session before deploying.",
  );
  process.exit(0);
}

const payloadCommand = process.platform === "win32" ? "payload.cmd" : "payload";
const result = spawnSync(payloadCommand, ["migrate"], {
  env: {
    ...process.env,
    DATABASE_URL: migrationDatabaseUrl,
  },
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
