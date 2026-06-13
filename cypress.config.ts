import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "https://e-commerce.wannasingh.dev",
    supportFile: false,
    chromeWebSecurity: false, // Bypass SSL verification errors for self-signed certificates
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
  },
});
