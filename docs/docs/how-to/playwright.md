# Playwright

[Playwright](https://playwright.dev/) is a great tool for end-to-end testing.

Ideally, you continue to use Jest tests for writing unit tests for all your components, cells, layouts, and pages. Then, you can use Playwright to write end-to-end tests to test how everything integrates and works together.

## Installation

### 1. Within the Terminal, run:

```sh
yarn create playwright
```

:::info
You can find additional information about [installing Playwright on their documentation.](https://playwright.dev/docs/intro)
:::

Then, the install command will prompt you with a few questions:

- **Do you want to use TypeScript or JavaScript?**
- **Where to put your end-to-end tests?** I'd recommend putting your test files inside the `web/src/e2e` directory.
- **Add a GitHub Actions workflow?** This will create a **.github/workflows/playwright.yml** file.
- **Install Playwright browsers (can be done manually via `yarn playwright install`)?**

![/img/playwright/04-install-browsers.png]()

### 2. Add a `script` to the `package.json` file within the root of your project directory.

::info
RedwoodJS has 3 `package.json` files. One inside the `api` directory, one inside the `web` directory, and one inside the root of your project. This script lives in the `package.json` file within the root of your project.
::

```json
"scripts": {
  "test:e2e": "npx playwright test -c ./playwright.config.ts --trace on --workers 1 --reporter=list"
}
```

This script utilizes several flags:

| Flag              | Description                      |
| ----------------- | -------------------------------- |
| `--trace on`      |                                  |
| `--workers 1`     | Disables parallelization         |
| `--reporter=list` | Command line report output style |

To run playwright, you can use:

```sh
yarn test:e2e
```

:::info
When running the test, I'm _not_ using `yarn rw`, simply `yar test:e2e`
:::

![/img/playwright/running-tests.png]()

## Writing your first test

```sh
npx playwright codegen
```

This will open a browser window and allow you to interact with the website. As you interact with the website, Playwright will generate the code for you.

![/img/playwright/generating-a-test.png]()

### You can also run your tests in UI mode:

```sh
npx playwright test --ui
```

This will open a separate window that provides a GUI for interacting with your tests.

![/img/playwright/playwright-ui.png]()

### Run your tests in headed mode:

This will give you the ability to visually see how Playwright interacts with the website.

```sh
npx playwright test --headed
```

By default, Playwright launches browsers in headless mode.

:::info
On Linux agents, headed execution requires [Xvfb](https://en.wikipedia.org/wiki/Xvfb) to be installed.
:::
