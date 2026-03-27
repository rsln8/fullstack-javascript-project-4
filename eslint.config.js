export default [
  {
    files: ["**/*.js", "**/*.cjs"],
    languageOptions: {
      sourceType: "module",
      ecmaVersion: "latest",
      globals: {
        node: true,
        jest: true,
      },
    },
    rules: {
      "no-console": "off",
      "no-underscore-dangle": "off",
      "no-restricted-syntax": "off",
      "no-unused-vars": "off",
    },
  },
];
