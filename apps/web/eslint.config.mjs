import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Fetch-on-mount is a deliberate, standard pattern here — this app
      // intentionally has no data-fetching library (SWR/React Query) as a
      // dependency, so effects are the correct place for it.
      "react-hooks/set-state-in-effect": "off",
      // Flags `window.location.href = ...`, the standard way to leave the
      // SPA entirely (e.g. redirecting to a third-party app's redirect_uri)
      // — not a React state mutation.
      "react-hooks/immutability": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
