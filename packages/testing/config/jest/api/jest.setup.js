/* eslint-env jest */
const path = require('path')

const { getSchemaDefinitions } = require('@redwoodjs/cli/dist/lib')
const { setContext } = require('@redwoodjs/graphql-server')
const { getPaths } = require('@redwoodjs/internal')
const { defineScenario } = require('@redwoodjs/testing/dist/api')
const { db } = require(path.join(getPaths().api.src, 'lib', 'db'))

const DEFAULT_SCENARIO = 'standard'

const seedScenario = async (scenario) => {
  if (scenario) {
    const scenarios = {}
    for (const [model, namedFixtures] of Object.entries(scenario)) {
      scenarios[model] = {}
      for (const [name, createArgs] of Object.entries(namedFixtures)) {
        if (typeof createArgs === 'function') {
          scenarios[model][name] = await db[model].create(createArgs(scenarios))
        } else {
          scenarios[model][name] = await db[model].create(createArgs)
        }
      }
    }
    return scenarios
  } else {
    return {}
  }
}

const teardown = async () => {
  const prismaModelNames = (await getSchemaDefinitions()).datamodel.models.map(
    (m) => m.dbName || m.name
  )

  for (const model of prismaModelNames) {
    await db.$queryRaw(`DELETE FROM "${model}"`)
  }
}

const buildScenario =
  (it) =>
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
      const path = require('path')
      const testFileDir = path.parse(global.testPath)
      const testFilePath = `${testFileDir.dir}/${
        testFileDir.name.split('.')[0]
      }.scenarios`
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
          throw (
            ('UndefinedScenario',
            `There is no scenario named "${scenarioName}" in ${testFilePath}.js`)
          )
        }
      }

      const scenarioData = await seedScenario(scenario)
      result = await testFunc(scenarioData)

      return result
    })
  }

global.scenario = buildScenario(global.it)
global.scenario.only = buildScenario(global.it.only)

global.defineScenario = defineScenario

global.mockCurrentUser = (currentUser) => {
  setContext({ currentUser })
}

// Disable perRequestContext for tests
beforeAll(() => {
  process.env.DISABLE_CONTEXT_ISOLATION = '1'
})

afterAll(async () => {
  await db.$disconnect()
})

afterEach(async () => {
  await teardown()
})
