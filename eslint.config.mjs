import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(["node_modules/**", "dist/**"]),
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "react/display-name": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        { allowExpressions: true },
      ],
    },
  },
  {
    files: ["tests/**/*.ts", "**/*.mock.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
