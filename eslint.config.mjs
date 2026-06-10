// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginAstro from "eslint-plugin-astro";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import pluginImport from "eslint-plugin-import";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  // ── Global ignores ───────────────────────────────────────────────────────
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.astro/**",
      "**/.medusa/**",
      "**/coverage/**",
      "**/*.min.js",
      "**/*.d.ts",
      // Config files at root have no tsconfig — exclude from type-aware linting
      "*.config.{mjs,cjs,js}",
      "eslint.config.mjs",
    ],
  },

  // ── Base JS recommended (all files) ─────────────────────────────────────
  js.configs.recommended,

  // ── TypeScript (non-type-aware) for all TS/TSX/Astro ────────────────────
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },

  // ── TypeScript strict TYPE-AWARE rules (.ts / .tsx only) ─────────────────
  // These rules require full type information and a valid tsconfig.
  // Explicitly excluded: .astro, .mjs, .cjs, .js config files.
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: ["apps/**/*.ts", "apps/**/*.tsx"],
  })),
  ...tseslint.configs.stylisticTypeChecked.map((config) => ({
    ...config,
    files: ["apps/**/*.ts", "apps/**/*.tsx"],
  })),
  {
    files: ["apps/**/*.ts", "apps/**/*.tsx"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Enforce explicit return types for API clarity
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
      // Unsafe patterns
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      // Async safety
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/consistent-type-exports": "error",
    },
  },

  // ── React (for Astro island components) ─────────────────────────────────
  {
    files: ["**/*.{tsx,jsx}"],
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "jsx-a11y": jsxA11y,
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },

  // ── Astro files ──────────────────────────────────────────────────────────
  ...eslintPluginAstro.configs.recommended,
  ...eslintPluginAstro.configs["jsx-a11y-recommended"],

  // ── Import ordering & hygiene ────────────────────────────────────────────
  {
    plugins: { import: pluginImport },
    rules: {
      "import/no-duplicates": "error",
      "import/no-self-import": "error",
      "import/no-extraneous-dependencies": "error",
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index", "type"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },

  // ── Prettier must be last (disables formatting rules) ───────────────────
  prettierConfig,
);
