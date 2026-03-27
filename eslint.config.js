import stylistic from '@stylistic/eslint-plugin';

export default [
  {
    plugins: {
      '@stylistic': stylistic,
    },
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
      "@stylistic/linebreak-style": "off",
    },
  },
];
