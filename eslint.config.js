export default [
  {
    files: ["**/*.js"],
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
      "linebreak-style": "off",
    },
  },
];
