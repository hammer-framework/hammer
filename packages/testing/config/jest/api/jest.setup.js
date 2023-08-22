/* eslint-env jest */
// @ts-check

// @NOTE without these imports in the setup file, mockCurrentUser
// will remain undefined in the user's tests
// Remember to use specific imports
const { setContext } = require('@redwoodjs/graphql-server/dist/globalContext')
const { defineScenario } = require('@redwoodjs/testing/dist/api/scenario')

// @NOTE we do this because jest.setup.js runs every time in each context
// while jest-preset runs once. This significantly reduces memory footprint, and testing time
// The key is to reduce the amount of imports in this file, because the require.cache is not shared between each test context
const { apiSrcPath, tearDownCachePath, dbSchemaPath } =
  global.__RWJS__TEST_IMPORTS

global.defineScenario = defineScenario

// Error codes thrown by [MySQL, SQLite, Postgres] when foreign key constraint
// fails on DELETE
const FOREIGN_KEY_ERRORS = [1451, 1811, 23503]
const TEARDOWN_CACHE_PATH = tearDownCachePath
const DEFAULT_SCENARIO = 'standard'
let teardownOrder = []
let originalTeardownOrder = []

const deepCopy = (obj) => {
  return JSON.parse(JSON.stringify(obj))
}

const isIdenticalArray = (a, b) => {
  return JSON.stringify(a) === JSON.stringify(b)
}

const configureTeardown = async () => {
  const { getDMMF } = require('@prisma/internals')
  const fs = require('node:fs')

  // @NOTE prisma utils are available in cli lib/schemaHelpers
  // But avoid importing them, to prevent memory leaks in jest
  const schema = await getDMMF({ datamodelPath: dbSchemaPath })
  const schemaModels = schema.datamodel.models.map((m) => m.dbName || m.name)

  // check if pre-defined delete order already exists and if so, use it to start
  if (fs.existsSync(TEARDOWN_CACHE_PATH)) {
    teardownOrder = JSON.parse(fs.readFileSync(TEARDOWN_CACHE_PATH).toString())
  }

  // check the number of models in case we've added/removed since cache was built
  if (teardownOrder.length !== schemaModels.length) {
    teardownOrder = schemaModels
  }

  // keep a copy of the original order to compare against
  originalTeardownOrder = deepCopy(teardownOrder)
}

let quoteStyle
// determine what kind of quotes are needed around table names in raw SQL
const getQuoteStyle = async () => {
  const { getConfig: getPrismaConfig } = require('@prisma/internals')
  const fs = require('node:fs')

  if (!quoteStyle) {
    const config = await getPrismaConfig({
      datamodel: fs.readFileSync(dbSchemaPath).toString(),
    })

    switch (config.datasources?.[0]?.provider) {
      case 'mysql':
        quoteStyle = '`'
        break
      default:
        quoteStyle = '"'
    }
  }

  return quoteStyle
}

const getProjectDb = () => {
  const { db } = require(`${apiSrcPath}/lib/db`)

  return db
}

const buildScenario =
  (it, testPath) =>
  (...args) => {
    let scenarioName, testName, testFunc

    if (args.length === 3) {
      ;[scenarioName, testName, testFunc] = args
    } else if (args.length === 2) {
      scenarioName = DEFAULT_SCENARIO
      ;[testName, testFunc] = args
    } else {
      throw new Error('scenario() requires 2 or 3 arguments')
    }

    return it(testName, async () => {
      const path = require('node:path')
      const testFileDir = path.parse(testPath)
      // e.g. ['comments', 'test'] or ['signup', 'state', 'machine', 'test']
      const testFileNameParts = testFileDir.name.split('.')
      const testFilePath = `${testFileDir.dir}/${testFileNameParts
        .slice(0, testFileNameParts.length - 1)
        .join('.')}.scenarios`
      let allScenarios, scenario, result

      try {
        allScenarios = require(testFilePath)
      } catch (e) {
        // ignore error if scenario file not found, otherwise re-throw
        if (e.code !== 'MODULE_NOT_FOUND') {
          throw e
        }
      }

      if (allScenarios) {
        if (allScenarios[scenarioName]) {
          scenario = allScenarios[scenarioName]
        } else {
          throw new Error(
            `UndefinedScenario: There is no scenario named "${scenarioName}" in ${testFilePath}.{js,ts}`
          )
        }
      }

      const scenarioData = await seedScenario(scenario)
      result = await testFunc(scenarioData)

      return result
    })
  }

const teardown = async () => {
  const fs = require('node:fs')

  const quoteStyle = await getQuoteStyle()

  for (const modelName of teardownOrder) {
    try {
      await getProjectDb().$executeRawUnsafe(
        `DELETE FROM ${quoteStyle}${modelName}${quoteStyle}`
      )
    } catch (e) {
      const match = e.message.match(/Code: `(\d+)`/)
      if (match && FOREIGN_KEY_ERRORS.includes(parseInt(match[1]))) {
        const index = teardownOrder.indexOf(modelName)
        teardownOrder[index] = null
        teardownOrder.push(modelName)
      } else {
        throw e
      }
    }
  }

  // remove nulls
  teardownOrder = teardownOrder.filter((val) => val)

  // if the order of delete changed, write out the cached file again
  if (!isIdenticalArray(teardownOrder, originalTeardownOrder)) {
    originalTeardownOrder = deepCopy(teardownOrder)
    fs.writeFileSync(TEARDOWN_CACHE_PATH, JSON.stringify(teardownOrder))
  }
}

const seedScenario = async (scenario) => {
  if (scenario) {
    const scenarios = {}
    for (const [model, namedFixtures] of Object.entries(scenario)) {
      scenarios[model] = {}
      for (const [name, createArgs] of Object.entries(namedFixtures)) {
        if (typeof createArgs === 'function') {
          scenarios[model][name] = await getProjectDb()[model].create(
            createArgs(scenarios)
          )
        } else {
          scenarios[model][name] = await getProjectDb()[model].create(
            createArgs
          )
        }
      }
    }
    return scenarios
  } else {
    return {}
  }
}

global.scenario = buildScenario(global.it, global.testPath)
global.scenario.only = buildScenario(global.it.only, global.testPath)

global.mockCurrentUser = (currentUser) => {
  setContext({ currentUser })
}

/**
 *
 * All these hooks run in the VM/Context that the test runs in since we're using "setupAfterEnv".
 * There's a new context for each test-suite i.e. each test file
 *
 * Doing this means if the db isn't used in the current test context,
 * no need to do any of the teardown logic - allowing simple tests to run faster
 * At the same time, if the db is used, disconnecting it in this context prevents connection limit errors.
 * Just disconnecting db in jest-preset is not enough, because
 * the Prisma client is created in a different context.
 */
const wasDbUsed = () => {
  try {
    const libDbPath = require.resolve(`${apiSrcPath}/lib/db`)
    return Object.keys(require.cache).some((module) => {
      return module === libDbPath
    })
  } catch (e) {
    // If db wasn't resolved, no point trying to perform db resets
    return false
  }
}

beforeEach(() => {
  // Attempt to emulate the request context isolation behavior
  const mockContextStore = new Map()
  mockContextStore.set('context', {})
  jest
    .spyOn(
      require('@redwoodjs/graphql-server/dist/globalContextStore'),
      'getAsyncStoreInstance'
    )
    // @ts-expect-error - We are not providing the full functionality of the AsyncLocalStorage in this returned object
    .mockImplementation(() => {
      return {
        getStore: () => {
          return mockContextStore
        },
      }
    })
})

beforeAll(async () => {
  if (wasDbUsed()) {
    await configureTeardown()
  }
})

afterAll(async () => {
  if (wasDbUsed()) {
    getProjectDb().$disconnect()
  }
})

afterEach(async () => {
  if (wasDbUsed()) {
    await teardown()
  }
})
