global.__dirname = __dirname
jest.mock('fs')
jest.mock('src/lib', () => {
  const path = require('path')
  return {
    ...require.requireActual('src/lib'),
    generateTemplate: () => '',
    getSchema: () =>
      require(path.join(global.__dirname, 'fixtures', 'post.json')),
  }
})

import fs from 'fs'

import 'src/lib/test'
import { getPaths } from 'src/lib'

import { files } from '../../../generate/scaffold/scaffold'
import { tasks } from '../scaffold'

describe('destroy scaffold post', () => {
  beforeEach(async () => {
    fs.__setMockFiles({
      ...(await files({ model: 'Post' })),
      [getPaths().web.routes]: [
        '<Routes>',
        '  <Route path="/posts/new" page={NewPostPage} name="newPost" />',
        '  <Route path="/posts/{id:Int}/edit" page={EditPostPage} name="editPost" />',
        '  <Route path="/posts/{id:Int}" page={PostPage} name="post" />',
        '  <Route path="/posts" page={PostsPage} name="posts" />',
        '  <Route path="/" page={HomePage} name="home" />',
        '  <Route notfound page={NotFoundPage} />',
        '</Routes>',
      ].join('\n'),
    })
  })

  afterEach(() => {
    fs.__setMockFiles({})
    jest.spyOn(fs, 'unlinkSync').mockClear()
  })

  test('destroys files', async () => {
    const unlinkSpy = jest.spyOn(fs, 'unlinkSync')
    const t = tasks({ model: 'Post' })
    t.setRenderer('silent')

    return t._tasks[0].run().then(async () => {
      const generatedFiles = Object.keys(await files({ model: 'Post' }))
      expect(generatedFiles.length).toEqual(unlinkSpy.mock.calls.length)
      generatedFiles.forEach((f) => expect(unlinkSpy).toHaveBeenCalledWith(f))
    })
  })

  test('cleans up routes from Routes.js', async () => {
    const t = tasks({ model: 'Post' })
    t.setRenderer('silent')

    return t._tasks[1].run().then(() => {
      const routes = fs.readFileSync(getPaths().web.routes)
      expect(routes).toEqual(
        [
          '<Routes>',
          '  <Route path="/" page={HomePage} name="home" />',
          '  <Route notfound page={NotFoundPage} />',
          '</Routes>',
        ].join('\n')
      )
    })
  })
})

describe('destroy namespaced scaffold post', () => {
  beforeEach(async () => {
    fs.__setMockFiles({
      ...(await files({ model: 'Post', path: 'admin' })),
      [getPaths().web.routes]: [
        '<Routes>',
        '  <Route path="/admin/posts/new" page={AdminNewPostPage} name="adminNewPost" />',
        '  <Route path="/admin/posts/{id:Int}/edit" page={AdminEditPostPage} name="adminEditPost" />',
        '  <Route path="/admin/posts/{id:Int}" page={AdminPostPage} name="adminPost" />',
        '  <Route path="/" page={HomePage} name="home" />',
        '  <Route notfound page={NotFoundPage} />',
        '</Routes>',
      ].join('\n'),
    })
  })

  afterEach(() => {
    fs.__setMockFiles({})
    jest.spyOn(fs, 'unlinkSync').mockClear()
  })

  test('destroys files', async () => {
    const unlinkSpy = jest.spyOn(fs, 'unlinkSync')
    const t = tasks({ model: 'Post', path: 'admin' })
    t.setRenderer('silent')

    return t._tasks[0].run().then(async () => {
      const generatedFiles = Object.keys(
        await files({ model: 'Post', path: 'admin' })
      )
      expect(generatedFiles.length).toEqual(unlinkSpy.mock.calls.length)
      generatedFiles.forEach((f) => expect(unlinkSpy).toHaveBeenCalledWith(f))
    })
  })

  test('cleans up routes from Routes.js', async () => {
    const t = tasks({ model: 'Post', path: 'admin' })
    t.setRenderer('silent')

    return t._tasks[1].run().then(() => {
      const routes = fs.readFileSync(getPaths().web.routes)
      expect(routes).toEqual(
        [
          '<Routes>',
          '  <Route path="/" page={HomePage} name="home" />',
          '  <Route notfound page={NotFoundPage} />',
          '</Routes>',
        ].join('\n')
      )
    })
  })
})
