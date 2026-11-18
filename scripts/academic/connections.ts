import {Pool} from "pg";

/** Separate connection paths for academic migrations and approved writes. */
export function academicConnection(kind: "migrator" | "writer" | "test") {
  const key = kind === "test" ? "ACADEMIC_TEST_DATABASE_URL" : kind === "migrator" ? "ACADEMIC_MIGRATION_DATABASE_URL" : "ACADEMIC_WRITER_DATABASE_URL";
  const raw = process.env[key];
  if (!raw) throw new Error(`${key} is required`);
  const url = new URL(raw);
  const database = decodeURIComponent(url.pathname.slice(1));
  const local = ["127.0.0.1", "localhost", "::1", "[::1]"].includes(url.hostname);
  if (kind === "test") {
    if (!local || database !== "komitehane_academic_test") throw new Error("TEST_DATABASE_MUST_BE_LOCAL_AND_NAMED_komitehane_academic_test");
  } else {
    if (database !== "komitehane_academic") throw new Error("ACADEMIC_DATABASE_NAME_MUST_BE_komitehane_academic");
  }
  if (["ssl", "sslmode", "sslcert", "sslkey", "sslrootcert"].some(x => url.searchParams.has(x))) throw new Error("REMOVE_SSL_QUERY_PARAMETERS");
  let ssl: {ca:string;rejectUnauthorized:true} | undefined;
  if (kind !== "test") {
    const encoded = process.env.ACADEMIC_POSTGRES_CA_CERT_BASE64;
    if (!encoded) throw new Error("ACADEMIC_POSTGRES_CA_CERT_BASE64_REQUIRED");
    const ca = Buffer.from(encoded,"base64").toString("utf8").trim();
    if (!ca.startsWith("-----BEGIN CERTIFICATE-----") || !ca.endsWith("-----END CERTIFICATE-----")) throw new Error("INVALID_ACADEMIC_CA");
    ssl = {ca,rejectUnauthorized:true};
  }
  return new Pool({connectionString:raw,ssl,max:2,connectionTimeoutMillis:5000,idleTimeoutMillis:10000});
}
