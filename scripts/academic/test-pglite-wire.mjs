// Runs the same migration and seed path over PostgreSQL wire protocol using
// an in-memory PGlite server. This does not replace Docker PostgreSQL tests.
import {PGlite} from "@electric-sql/pglite";
import {PGLiteSocketServer} from "@electric-sql/pglite-socket";
import {spawn} from "node:child_process";
const db=await PGlite.create();
const server=new PGLiteSocketServer({db,host:"127.0.0.1",port:55439});
try {
  await server.start();
  const child=spawn("pnpm",["academic:test:postgres","--single-connection"],{stdio:"inherit",env:{...process.env,ACADEMIC_TEST_DATABASE_URL:"postgresql://academic_test:academic_local_test_only@127.0.0.1:55439/komitehane_academic_test"}});
  const timer=setTimeout(()=>{console.error("PGlite wire test timed out");child.kill("SIGTERM")},45000);
  const code=await new Promise(resolve=>child.on("close",resolve));clearTimeout(timer);
  process.exitCode=code??1;
} finally {await server.stop();await db.close();}
