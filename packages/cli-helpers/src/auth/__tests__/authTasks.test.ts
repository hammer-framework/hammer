// Have to use `var` here to avoid "Temporal Dead Zone" issues
// eslint-disable-next-line
var mockIsTypeScriptProject = true
global.__dirname = __dirname

jest.mock('../../lib/paths', () => {
  const path = require('path')

  return {
    ...jest.requireActual('../../lib/paths'),
    getPaths: () => {
      const base = '/mock/base/path'

      return {
        web: {
          src: path.join(base, 'web', 'src'),
        },
      }
    },
  }
})

jest.mock('../../lib/project', () => ({
  isTypeScriptProject: () => mockIsTypeScriptProject,
}))

jest.mock('../../lib', () => ({
  transformTSToJS: (_path: string, data: string) => data,
}))

// This will load packages/cli-helpers/__mocks__/fs.js
jest.mock('fs')

const mockFS = fs as unknown as Omit<jest.Mocked<typeof fs>, 'readdirSync'> & {
  __setMockFiles: (files: Record<string, string>) => void
  readdirSync: () => string[]
}

mockFS.readdirSync = () => {
  return ['auth.ts.template']
}

import fs from 'fs'
import path from 'path'

import { getPaths } from '../../lib/paths'
import { createWebAuth } from '../authTasks'

function platformPath(filePath: string) {
  return filePath.split('/').join(path.sep)
}

beforeEach(() => {
  mockIsTypeScriptProject = true

  mockFS.__setMockFiles({
    [platformPath('/mock/setup/path/templates/web/auth.ts.template')]:
      '// web auth template',
  })
})

it('writes an auth.ts file for TS projects', () => {
  const basedir = '/mock/setup/path'
  createWebAuth(basedir, 'auth0', false)

  expect(
    fs.readFileSync(path.join(getPaths().web.src, 'auth.ts'))
  ).toMatchSnapshot()
})

it('writes an auth.js file for JS projects', () => {
  mockIsTypeScriptProject = false
  const basedir = '/mock/setup/path'
  createWebAuth(basedir, 'auth0', false)

  expect(
    fs.readFileSync(path.join(getPaths().web.src, 'auth.js'))
  ).toMatchSnapshot()
})
