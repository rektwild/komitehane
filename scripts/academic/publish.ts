import {academicConnection} from "./connections";
import {publishVersion} from "../../lib/academic/services/publish";
const versionId=process.argv[2];
if (!versionId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(versionId) || process.env.ACADEMIC_SOURCE_MANUALLY_REVIEWED !== "yes") throw new Error("Usage: ACADEMIC_SOURCE_MANUALLY_REVIEWED=yes pnpm academic:publish <version-uuid>; review the official source first.");
const pool=academicConnection("writer");
try {await publishVersion(pool,versionId); console.log("Published version",versionId);} finally {await pool.end();}
