import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ignore generated/test scripts (not part of the app)
    "scripts/**",
    "prisma/seed.ts",
    // Ignore shadcn/ui components (generated code, not our responsibility)
    "components/ui/carousel.tsx",
  ]),
]);

export default eslintConfig;
