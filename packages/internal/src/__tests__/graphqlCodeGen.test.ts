// jest.mock('fs', () => {
//   const actual = jest.requireActual('fs')

//   return {
//     ...actual,
//     mkdirSync: () => {},
//     writeFileSync: (target, contents) => {
//       // if (!global.mockFs) {
//       //   return actual.writeFileSync.call(null, target, contents)
//       // }
//     },
//     writeFileSyncActual: (target, contents) => {
//       return actual.writeFileSync.call(null, target, contents)
//     },
//   }
// })

import fs from 'fs'
import path from 'path'

import {
  generateTypeDefGraphQLApi,
  generateTypeDefGraphQLWeb,
} from '../generate/graphqlCodeGen'
import { generateGraphQLSchema } from '../generate/graphqlSchema'

const FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../../__fixtures__/example-todo-main'
)

beforeAll(() => {
  process.env.RWJS_CWD = FIXTURE_PATH
})

afterAll(() => {
  delete process.env.RWJS_CWD
})

afterEach(() => {
  jest.restoreAllMocks()
})

test('Generate gql typedefs web', async () => {
  await generateGraphQLSchema()

  jest
    .spyOn(fs, 'writeFileSync')
    .mockImplementation(
      (file: fs.PathOrFileDescriptor, data: string | ArrayBufferView) => {
        expect(file).toMatch(path.join('web', 'types', 'graphql.d.ts'))
        expect(data).toMatchSnapshot()
      }
    )

  const webPaths = await generateTypeDefGraphQLWeb()

  expect(webPaths).toHaveLength(1)
  expect(webPaths[0]).toMatch(path.join('web', 'types', 'graphql.d.ts'))
})

test('Generate gql typedefs api', async () => {
  await generateGraphQLSchema()

  jest
    .spyOn(fs, 'writeFileSync')
    .mockImplementation(
      (file: fs.PathOrFileDescriptor, data: string | ArrayBufferView) => {
        expect(file).toMatch(path.join('api', 'types', 'graphql.d.ts'))
        expect(data).toMatchSnapshot()
      }
    )

  const apiPaths = await generateTypeDefGraphQLApi()

  expect(apiPaths).toHaveLength(1)
  expect(apiPaths[0]).toMatch(path.join('api', 'types', 'graphql.d.ts'))
})

test('respects user provided codegen config', async () => {
  const customCodegenConfigPath = path.join(FIXTURE_PATH, 'codegen.yml')

  // Add codegen.yml to fixture folder
  fs.writeFileSync(
    customCodegenConfigPath,
    `config:
  omitOperationSuffix: false
  namingConvention:
    typeNames: change-case-all#upperCase`
  )

  // Wrapping in `try` to make sure codegen.yml is always deleted, even if the
  // test fails
  try {
    await generateGraphQLSchema()
    const [outputPath] = await generateTypeDefGraphQLWeb()

    const gqlTypesOutput = fs.readFileSync(outputPath, 'utf-8')

    // Should be upper cased type
    expect(gqlTypesOutput).toContain('ADDTODO_CREATETODOMUTATION')

    // because we override omitOperationSuffix to false, it should append QUERY
    // for __fixtures__/example-todo-main/../NumTodosCell.js
    expect(gqlTypesOutput).toContain('NUMTODOSCELL_GETCOUNTQUERY')
  } finally {
    // Delete added codegen.yml
    fs.rmSync(customCodegenConfigPath)
  }
})

test("Doesn't throw or print any errors with empty project", async () => {
  const fixturePath = path.resolve(
    __dirname,
    '../../../../__fixtures__/empty-project'
  )
  process.env.RWJS_CWD = fixturePath
  const oldConsoleError = console.error
  console.error = jest.fn()

  try {
    await generateGraphQLSchema()
    await generateTypeDefGraphQLWeb()
    await generateTypeDefGraphQLApi()
  } catch (e) {
    console.error(e)
    // Fail if any of the three above calls throws an error
    expect(false).toBeTruthy()
  }

  try {
    expect(console.error).not.toHaveBeenCalled()
  } finally {
    console.error = oldConsoleError
    delete process.env.RWJS_CWD
  }
})

describe("Doesn't swallow legit errors", () => {
  test('invalidQueryType', async () => {
    const fixturePath = path.resolve(
      __dirname,
      './fixtures/graphqlCodeGen/invalidQueryType'
    )
    process.env.RWJS_CWD = fixturePath
    const oldConsoleError = console.error
    console.error = jest.fn()

    await generateTypeDefGraphQLWeb()

    try {
      expect(console.error).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          message: expect.stringMatching(/field.*softKitten.*Query/),
        })
      )
    } finally {
      console.error = oldConsoleError
      delete process.env.RWJS_CWD
    }
  })

  test('missingType', async () => {
    const fixturePath = path.resolve(
      __dirname,
      './fixtures/graphqlCodeGen/missingType'
    )
    process.env.RWJS_CWD = fixturePath
    const oldConsoleError = console.error
    console.error = jest.fn()

    await generateTypeDefGraphQLWeb()

    try {
      expect(console.error).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          message: expect.stringMatching(/Unknown type.*Todo/),
        })
      )
    } finally {
      console.error = oldConsoleError
      delete process.env.RWJS_CWD
    }
  })

  test('nonExistingField', async () => {
    const fixturePath = path.resolve(
      __dirname,
      './fixtures/graphqlCodeGen/nonExistingField'
    )
    process.env.RWJS_CWD = fixturePath
    const oldConsoleError = console.error
    console.error = jest.fn()

    await generateTypeDefGraphQLWeb()

    try {
      expect(console.error).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          message: expect.stringMatching(/field.*done.*Todo/),
        })
      )
    } finally {
      console.error = oldConsoleError
      delete process.env.RWJS_CWD
    }
  })
})
