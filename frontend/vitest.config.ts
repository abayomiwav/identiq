/** Vitest config for the web app: jsdom environment and the @ path alias. */

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://localhost:3002",
      },
    },
  },
});
