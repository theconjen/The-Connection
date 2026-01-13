module.exports = {
  root: true,
  extends: [],
  rules: {
    // Prevent console.log in production code
    "no-console": [
      "error",
      {
        allow: ["warn", "error", "info", "debug"]
      }
    ],
    "no-restricted-properties": [
      "warn",
      {
        object: "Locator",
        property: "getByText",
        message: "Prefer getByTestId to avoid i18n flakiness.",
      },
    ],
  },
  overrides: [
    {
      files: ["apps/web/tests/**/*.ts"],
      rules: {
        "no-restricted-syntax": [
          "warn",
          {
            selector: "CallExpression[callee.property.name='getByText']",
            message: "Use getByTestId; tests must be i18n-safe.",
          },
        ],
      },
    },
  ],
};
