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
      "@stylistic/semi": "off",
      "@stylistic/quotes": "off",
      "@stylistic/brace-style": "off",
      "@stylistic/eol-last": "off",
      "@stylistic/arrow-parens": "off",
    },
  },
];
