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
    // Generated files (PWA service worker, workbox)
    "public/sw.js",
    "public/workbox-*.js",
    // Build scripts
    "scripts/**",
  ]),
  // React best practices
  {
    rules: {
      // Ensure useEffect/useCallback dependencies are correct
      "react-hooks/exhaustive-deps": "warn",
      // Avoid using array index as key (causes re-render issues)
      "react/no-array-index-key": "warn",
      // Encourage explicit typing over 'any'
      "@typescript-eslint/no-explicit-any": "warn",
      // Prevent unused variables
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],
      // Enforce consistent return types
      "@typescript-eslint/explicit-function-return-type": "off",
      // Warn on console.log in production code
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  // Allow console in logger and email service (intentional logging)
  {
    files: ["src/lib/logger.ts", "src/lib/email/**"],
    rules: {
      "no-console": "off",
    },
  },
]);

export default eslintConfig;
