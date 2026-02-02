import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import convexPlugin from "@convex-dev/eslint-plugin";

const eslintConfig = defineConfig([
    ...nextVitals,
    ...convexPlugin.configs.recommended,
    // Override default ignores of eslint-config-next.
    globalIgnores([
        // Default ignores of eslint-config-next:
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
        // Generated files
        "convex/_generated/**",
        "app/.well-known/workflow/**",
    ]),
]);

export default eslintConfig;
