import type { UserConfig } from "vitest/config";

const config: UserConfig = {
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/api/**/*.ts"],
    },
  },
};

export default config;
