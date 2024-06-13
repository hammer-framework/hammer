let mockExecutedTaskTitles = []
let mockSkippedTaskTitles = []

global.__dirname = __dirname

vi.mock('fs-extra')

import path from 'path'

// Load mocks
import '../../../../lib/test'

const actualFs = await vi.importActual('fs-extra')
import Enquirer from 'enquirer'
import { vol } from 'memfs'
import { vi, describe, it, expect, beforeEach } from 'vitest'

import { getPaths } from '../../../../lib'
import * as dbAuth from '../dbAuth'

vi.mock('listr2', async () => {
  const listrImpl = (tasks) => {
    return {
      run: async () => {
        mockExecutedTaskTitles = []
        mockSkippedTaskTitles = []

        for (const task of tasks) {
          const skip =
            typeof task.skip === 'function' ? task.skip : () => task.skip

          if (skip()) {
            mockSkippedTaskTitles.push(task.title)
          } else {
            const augmentedTask = {
              ...task,
              newListr: listrImpl,
              prompt: () => {},
              skip: (msg) => {
                mockSkippedTaskTitles.push(msg || task.title)
              },
            }
            await task.task({}, augmentedTask)

            // storing the title after running the task in case the task
            // modifies its own title
            mockExecutedTaskTitles.push(augmentedTask.title)
          }
        }
      },
    }
  }

  return {
    // Return a constructor function, since we're calling `new` on Listr
    Listr: vi.fn().mockImplementation(listrImpl),
  }
})

// Mock files needed for each test
const mockFiles = {}

const dbAuthTemplateFiles = [
  'forgotPassword.tsx.template',
  'login.tsx.template',
  'login.webAuthn.tsx.template',
  'resetPassword.tsx.template',
  'signup.tsx.template',
]
dbAuthTemplateFiles.forEach((templateFilename) => {
  mockFiles[path.join(__dirname, `../templates/${templateFilename}`)] = actualFs
    .readFileSync(path.join(__dirname, `../templates/${templateFilename}`))
    .toString()
})

mockFiles[
  path.join(__dirname, `../../scaffold/templates/assets/scaffold.css.template`)
] = actualFs
  .readFileSync(
    path.join(
      __dirname,
      `../../scaffold/templates/assets/scaffold.css.template`,
    ),
  )
  .toString()

mockFiles[getPaths().web.routes] = actualFs
  .readFileSync(
    path.join(
      __dirname,
      `../../../../../../../__fixtures__/example-todo-main/web/src/Routes.js`,
    ),
  )
  .toString()

mockFiles[getPaths().web.app] = actualFs
  .readFileSync(
    path.join(
      __dirname,
      `../../../../../../../__fixtures__/example-todo-main/web/src/App.js`,
    ),
  )
  .toString()

describe('dbAuth', () => {
  beforeEach(() => {
    vol.reset()
    vol.fromJSON(mockFiles)
  })

  it('creates a login page', async () => {
    expect(await dbAuth.files(true, false)).toHaveProperty([
      path.normalize('/path/to/project/web/src/pages/LoginPage/LoginPage.jsx'),
    ])
  })

  it('creates a signup page', async () => {
    expect(await dbAuth.files(true, false)).toHaveProperty([
      path.normalize(
        '/path/to/project/web/src/pages/SignupPage/SignupPage.jsx',
      ),
    ])
  })

  it('creates a scaffold CSS file', async () => {
    expect(await dbAuth.files(true, false)).toHaveProperty([
      path.normalize('/path/to/project/web/src/scaffold.css'),
    ])
  })

  describe('handler', () => {
    describe('WebAuthn task title', () => {
      it('is correct after prompting', async () => {
        const customEnquirer = new Enquirer({ show: false })
        customEnquirer.on('prompt', (prompt) => {
          prompt.submit()
        })

        await dbAuth.handler({
          enquirer: customEnquirer,
          listr2: { silentRendererCondition: true },
        })

        expect(mockExecutedTaskTitles[1]).toEqual(
          'Querying WebAuthn addition: WebAuthn addition not included',
        )
      })

      it('is correct after providing cli flag value `true`', async () => {
        const customEnquirer = new Enquirer({ show: false })
        customEnquirer.on('prompt', (prompt) => {
          prompt.submit()
        })

        await dbAuth.handler({
          enquirer: customEnquirer,
          listr2: { silentRendererCondition: true },
          webauthn: true,
        })

        expect(mockSkippedTaskTitles[0]).toEqual(
          'Querying WebAuthn addition: argument webauthn passed, WebAuthn included',
        )
      })

      it('is correct after providing cli flag value `false`', async () => {
        const customEnquirer = new Enquirer({ show: false })
        customEnquirer.on('prompt', (prompt) => {
          prompt.submit()
        })

        await dbAuth.handler({
          enquirer: customEnquirer,
          listr2: { silentRendererCondition: true },
          webauthn: false,
        })

        expect(mockSkippedTaskTitles[0]).toEqual(
          'Querying WebAuthn addition: argument webauthn passed, WebAuthn not included',
        )
      })
    })
  })
})
