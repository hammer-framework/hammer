import type { PlaywrightTestConfig } from '@playwright/test'

// See https://playwright.dev/docs/test-configuration#global-configuration
const config: PlaywrightTestConfig = {
  timeout: process.platform === 'win32' ? 90_000 : 60_000,
  // Leaving this here to make debugging easier, by uncommenting
  // use: {
  //   launchOptions: {
  //     slowMo: 500,
  //     headless: false,
  //   },
  // },
}

export default config
