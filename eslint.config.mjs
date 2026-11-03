import { defineConfig, globalIgnores } from "eslint/config";
import core from "eslint-config-next/core-web-vitals";
import ts from "eslint-config-next/typescript";
export default defineConfig([...core, ...ts, globalIgnores([".next/**", "next-env.d.ts", "playwright-report/**", "test-results/**"])]);
