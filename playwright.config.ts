import { defineConfig, devices } from "@playwright/test";

const port = 3170;
const hostname = "127.0.0.1";
const externalURL = process.env.FUTURESELF_E2E_BASE_URL;
const baseURL = externalURL || `http://${hostname}:${port}`;

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  timeout: 60_000,
  expect: { timeout: 12_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        channel: process.env.FUTURESELF_E2E_CHANNEL || undefined,
      },
    },
  ],
  webServer: externalURL ? undefined : {
    command: `npm run dev -- --hostname ${hostname} --port ${port}`,
    url: baseURL,
    timeout: 120_000,
    env: { OPENAI_API_KEY: "" },
    reuseExistingServer: false,
  },
});
