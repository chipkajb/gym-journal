import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  {
    rules: {
      // Fetch-on-mount and external-store sync legitimately set state in effects here;
      // keep it visible as a warning rather than blocking CI.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  { ignores: [".next/**", "public/**", "coverage/**", "playwright-report/**"] },
];

export default config;
