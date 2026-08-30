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
