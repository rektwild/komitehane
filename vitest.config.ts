import {fileURLToPath} from "node:url";
import {defineConfig} from "vitest/config";
export default defineConfig({resolve:{alias:{"@":fileURLToPath(new URL(".",import.meta.url)),"next/server":fileURLToPath(import.meta.resolve("next/server.js")),"server-only":fileURLToPath(new URL("./tests/academic/stubs/server-only.ts",import.meta.url))}},test:{server:{deps:{inline:["next-intl"]}}}});
