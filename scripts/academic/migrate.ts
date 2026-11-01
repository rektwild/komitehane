import {drizzle} from "drizzle-orm/node-postgres";
import {migrate} from "drizzle-orm/node-postgres/migrator";
import {academicConnection} from "./connections";
const pool=academicConnection("migrator");
try {await migrate(drizzle(pool),{migrationsFolder:"./drizzle/academic"});console.log("Academic migrations applied.");} finally {await pool.end();}
