import "server-only";
import {Pool} from "pg";

let pool: Pool | undefined;
let configurationWarningEmitted=false;
export function academicYear(): number | null {
  const raw = process.env.ACADEMIC_CURRENT_YEAR_START;
  if (!raw || !/^\d{4}$/.test(raw)) return null;
  const year = Number(raw);
  return year >= 1900 && year <= 2200 ? year : null;
}
export function academicPool(): Pool | null {
  if (process.env.ACADEMIC_FEATURE_ENABLED !== "true") return null;
  const url = process.env.ACADEMIC_DATABASE_URL;
  const ca = process.env.ACADEMIC_POSTGRES_CA_CERT_BASE64;
  if (!url || !ca || !academicYear()) {
    if (!configurationWarningEmitted) {console.error("ACADEMIC_CONFIGURATION_INCOMPLETE: verified defaults are disabled");configurationWarningEmitted=true;}
    return null;
  }
  if (pool) return pool;
  const parsed = new URL(url);
  if (decodeURIComponent(parsed.pathname.slice(1)) !== "komitehane_academic") throw new Error("ACADEMIC_DATABASE_NAME_INVALID");
  // Connection-string SSL parameters override node-postgres' ssl object.
  if (["sslmode","sslcert","sslkey","sslrootcert","ssl"].some(key => parsed.searchParams.has(key))) throw new Error("ACADEMIC_INVALID_TLS_CONFIGURATION");
  const certificate = Buffer.from(ca, "base64").toString("utf8");
  if (!certificate.includes("-----BEGIN CERTIFICATE-----")) throw new Error("ACADEMIC_INVALID_CA");
  pool = new Pool({connectionString:url,ssl:{ca:certificate,rejectUnauthorized:true},max:2,idleTimeoutMillis:10000,connectionTimeoutMillis:5000});
  return pool;
}
