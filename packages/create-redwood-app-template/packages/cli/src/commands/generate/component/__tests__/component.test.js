global.__dirname = __dirname
import { loadGeneratorFixture } from 'src/lib/test'

import * as component from '../component'

let singleWordFiles, multiWordFiles

beforeAll(() => {
  singleWordFiles = component.files({ name: 'User' })
  multiWordFiles = component.files({ name: 'UserProfile' })
})

test('returns exactly 2 files', () => {
  expect(Object.keys(singleWordFiles).length).toEqual(2)
})

test('creates a single word component', () => {
  expect(
    singleWordFiles['/path/to/project/web/src/components/User/User.js']
  ).toEqual(loadGeneratorFixture('component', 'singleWordComponent.js'))
})

test('creates a single word component test', () => {
  expect(
    singleWordFiles['/path/to/project/web/src/components/User/User.test.js']
  ).toEqual(loadGeneratorFixture('component', 'singleWordComponent.test.js'))
})

test('creates a multi word component', () => {
  expect(
    multiWordFiles[
      '/path/to/project/web/src/components/UserProfile/UserProfile.js'
    ]
  ).toEqual(loadGeneratorFixture('component', 'multiWordComponent.js'))
})

test('creates a multi word component test', () => {
  expect(
    multiWordFiles[
      '/path/to/project/web/src/components/UserProfile/UserProfile.test.js'
    ]
  ).toEqual(loadGeneratorFixture('component', 'multiWordComponent.test.js'))
})
