import type { PlaywrightTestConfig } from '@playwright/test'

// See https://playwright.dev/docs/test-configuration#global-configuration
const config: PlaywrightTestConfig = {
  timeout: 90_000,
  expect: {
    timeout: 10 * 1000,
  },
  // Leaving this here to make debugging easier, by uncommenting
  // use: {
  //   launchOptions: {
  //     slowMo: 500,
  //     headless: false,
  //   },
  // },
}

export default config
