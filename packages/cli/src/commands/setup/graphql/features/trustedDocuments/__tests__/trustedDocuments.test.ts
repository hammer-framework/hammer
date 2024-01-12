let mockExecutedTaskTitles: Array<string> = []
let mockSkippedTaskTitles: Array<string> = []

jest.mock('fs', () => require('memfs').fs)
jest.mock('node:fs', () => require('memfs').fs)
jest.mock('execa')
// The jscodeshift parts are tested by another test
jest.mock('../../fragments/runTransform', () => {
  return {
    runTransform: () => {
      return {}
    },
  }
})

jest.mock('listr2', () => {
  return {
    // Return a constructor function, since we're calling `new` on Listr
    Listr: jest.fn().mockImplementation((tasks: Array<any>) => {
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
              mockExecutedTaskTitles.push(task.title)
              await task.task()
            }
          }
        },
      }
    }),
  }
})

import path from 'node:path'

import { vol } from 'memfs'

import { handler } from '../trustedDocumentsHandler'

// Set up RWJS_CWD
let original_RWJS_CWD: string | undefined
const APP_PATH = '/redwood-app'

const tomlFixtures: Record<string, string> = {}

beforeAll(() => {
  original_RWJS_CWD = process.env.RWJS_CWD
  process.env.RWJS_CWD = APP_PATH

  const actualFs = jest.requireActual('fs')
  const tomlFixturesPath = path.join(__dirname, '__fixtures__', 'toml')

  tomlFixtures.default = actualFs.readFileSync(
    path.join(tomlFixturesPath, 'default.toml'),
    'utf-8'
  )

  tomlFixtures.fragments = actualFs.readFileSync(
    path.join(tomlFixturesPath, 'fragments.toml'),
    'utf-8'
  )

  tomlFixtures.fragmentsNoSpaceEquals = actualFs.readFileSync(
    path.join(tomlFixturesPath, 'fragments_no_space_equals.toml'),
    'utf-8'
  )

  tomlFixtures.trustedDocsAlreadySetup = actualFs.readFileSync(
    path.join(tomlFixturesPath, 'trusted_docs_already_setup.toml'),
    'utf-8'
  )

  tomlFixtures.trustedDocsNoSpaceEquals = actualFs.readFileSync(
    path.join(tomlFixturesPath, 'trusted_docs_no_space_equals.toml'),
    'utf-8'
  )

  tomlFixtures.trustedDocsFragmentsAlreadySetup = actualFs.readFileSync(
    path.join(tomlFixturesPath, 'trusted_docs_fragments_already_setup.toml'),
    'utf-8'
  )

  tomlFixtures.trustedDocsCommentedGraphql = actualFs.readFileSync(
    path.join(tomlFixturesPath, 'trusted_docs_commented_graphql.toml'),
    'utf-8'
  )
})

afterAll(() => {
  process.env.RWJS_CWD = original_RWJS_CWD
  jest.resetAllMocks()
  jest.resetModules()
})

// Silence console.info
console.info = jest.fn()

describe('Trusted documents setup', () => {
  it('runs all tasks', async () => {
    vol.fromJSON(
      { 'redwood.toml': '', 'api/src/functions/graphql.js': '' },
      APP_PATH
    )

    await handler({ force: false })

    expect(mockExecutedTaskTitles).toMatchInlineSnapshot(`
    [
      "Update Redwood Project Configuration to enable GraphQL Trusted Documents ...",
      "Generating Trusted Documents store ...",
      "Configuring the GraphQL Handler to use a Trusted Documents store ...",
    ]
  `)
  })

  describe('Project toml configuration updates', () => {
    describe('default toml where no graphql or trusted documents is setup', () => {
      it('updates the toml file with graphql and trusted documents enabled', async () => {
        vol.fromJSON(
          {
            'redwood.toml': tomlFixtures.default,
            'api/src/functions/graphql.js': '',
          },
          APP_PATH
        )

        await handler({ force: false })

        expect(vol.toJSON()[APP_PATH + '/redwood.toml']).toMatchSnapshot()
      })
    })
    describe('default toml where graphql fragments are already setup', () => {
      it('updates the toml file with graphql and trusted documents enabled and keeps fragments', async () => {
        vol.fromJSON(
          {
            'redwood.toml': tomlFixtures.fragments,
            'api/src/functions/graphql.ts': '',
          },
          APP_PATH
        )

        await handler({ force: false })

        expect(vol.toJSON()[APP_PATH + '/redwood.toml']).toMatchSnapshot()
      })
    })
    describe('default toml where graphql fragments are already setup using no spaces', () => {
      it('updates the toml file with graphql and trusted documents enabled and keeps fragments', async () => {
        vol.fromJSON(
          {
            'redwood.toml': tomlFixtures.fragmentsNoSpaceEquals,
            'api/src/functions/graphql.js': '',
          },
          APP_PATH
        )

        await handler({ force: false })

        expect(vol.toJSON()[APP_PATH + '/redwood.toml']).toMatchSnapshot()
      })
    })
    describe('default toml where graphql trusted documents are already setup', () => {
      it('makes no changes as trusted documents are already setup', async () => {
        vol.fromJSON(
          {
            'redwood.toml': tomlFixtures.trustedDocsAlreadySetup,
            'api/src/functions/graphql.js': '',
          },
          APP_PATH
        )

        await handler({ force: false })

        expect(vol.toJSON()[APP_PATH + '/redwood.toml']).toEqual(
          tomlFixtures.trustedDocsAlreadySetup
        )
      })
    })
    describe('default toml where graphql trusted documents are already setup using no spaces', () => {
      it('makes no changes as trusted documents are already setup', async () => {
        vol.fromJSON(
          {
            'redwood.toml': tomlFixtures.trustedDocsNoSpaceEquals,
            'api/src/functions/graphql.js': '',
          },
          APP_PATH
        )

        await handler({ force: false })

        expect(vol.toJSON()[APP_PATH + '/redwood.toml']).toEqual(
          tomlFixtures.trustedDocsNoSpaceEquals
        )
      })
    })
    describe('default toml where graphql trusted documents and fragments are already setup', () => {
      it('makes no changes as trusted documents are already setup', async () => {
        vol.fromJSON(
          {
            'redwood.toml': tomlFixtures.trustedDocsFragmentsAlreadySetup,
            'api/src/functions/graphql.js': '',
          },
          APP_PATH
        )

        await handler({ force: false })

        expect(vol.toJSON()[APP_PATH + '/redwood.toml']).toEqual(
          tomlFixtures.trustedDocsFragmentsAlreadySetup
        )
      })
    })
    describe('toml where graphql section is commented out', () => {
      it('adds a new section with `trustedDocuments = true`', async () => {
        vol.fromJSON(
          {
            'redwood.toml': tomlFixtures.trustedDocsCommentedGraphql,
            'api/src/functions/graphql.js': '',
          },
          APP_PATH
        )

        await handler({ force: false })

        expect(vol.toJSON()[APP_PATH + '/redwood.toml']).toMatchSnapshot()
      })
    })
  })
})
