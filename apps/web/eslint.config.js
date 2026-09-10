//  @ts-check

import { tanstackConfig } from "@tanstack/eslint-config"
import pluginRouter from "@tanstack/eslint-plugin-router"

export default [
  ...tanstackConfig,
  ...pluginRouter.configs["flat/recommended"],
  {
    rules: {
      "import/no-cycle": "off",
      "import/order": [
        "error",
        {
          alphabetize: { order: "asc", caseInsensitive: true },
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
            "type",
          ],
          distinctGroup: true,
          sortTypesGroup: false,
          named: true,
          warnOnUnassignedImports: false,
        },
      ],
      "sort-imports": "off",
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/require-await": "off",
      "pnpm/json-enforce-catalog": "off",
    },
  },
  {
    ignores: ["eslint.config.js", ".prettierrc"],
  },
]
