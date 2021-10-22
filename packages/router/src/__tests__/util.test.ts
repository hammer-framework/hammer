import {
  matchPath,
  parseSearch,
  validatePath,
  flattenSearchParams,
  replaceParams,
} from '../util'

describe('matchPath', () => {
  it.each([
    ['/post/{id:Int}', '/post/notAnInt'],
    ['/post/{id:Int}', '/post/2.0'],
    ['/post/{id:Int}', '/post/.1'],
    ['/post/{id:Int}', '/post/0.1'],
    ['/post/{id:Int}', '/post/123abcd'],
    ['/post/{id:Int}', '/post/abcd123'],
    ['/blog/{year}/{month:Int}/{day}', '/blog/2019/december/07'],
    ['/blog/{year}/{month}/{day}', '/blog/2019/07'],
    ['/posts/{id}/edit', '/posts//edit'],
    ['/about', '/'],
  ])('does not match route "%s" with path "%s"', (route, pathname) => {
    expect(matchPath(route, pathname)).toEqual({ match: false })
  })

  it('matches valid paths and extracts params correctly', () => {
    expect(matchPath('/post/{id:Int}', '/post/7')).toEqual({
      match: true,
      params: { id: 7 },
    })

    expect(matchPath('/blog/{year}/{month}/{day}', '/blog/2019/12/07')).toEqual(
      { match: true, params: { day: '07', month: '12', year: '2019' } }
    )
  })

  it('transforms a param for Int', () => {
    expect(matchPath('/post/{id}', '/post/1337')).toEqual({
      match: true,
      params: { id: '1337' },
    })

    expect(matchPath('/post/{id:Int}', '/post/1337')).toEqual({
      match: true,
      params: { id: 1337 },
    })
  })

  it('transforms a param for Boolean', () => {
    expect(matchPath('/signedUp/{status:Boolean}', '/signedUp/true')).toEqual({
      match: true,
      params: {
        status: true,
      },
    })

    expect(matchPath('/signedUp/{status:Boolean}', '/signedUp/false')).toEqual({
      match: true,
      params: {
        status: false,
      },
    })

    expect(
      matchPath('/signedUp/{status:Boolean}', '/signedUp/somethingElse')
    ).toEqual({
      match: false,
    })
  })

  it('transforms a param for Floats', () => {
    expect(
      matchPath('/version/{floatyMcFloat:Float}', '/version/1.58')
    ).toEqual({
      match: true,
      params: {
        floatyMcFloat: 1.58,
      },
    })

    expect(matchPath('/version/{floatyMcFloat:Float}', '/version/626')).toEqual(
      {
        match: true,
        params: {
          floatyMcFloat: 626,
        },
      }
    )

    expect(
      matchPath('/version/{floatyMcFloat:Float}', '/version/+0.92')
    ).toEqual({
      match: true,
      params: {
        floatyMcFloat: 0.92,
      },
    })

    expect(
      matchPath('/version/{floatyMcFloat:Float}', '/version/-5.5')
    ).toEqual({
      match: true,
      params: {
        floatyMcFloat: -5.5,
      },
    })

    expect(matchPath('/version/{floatyMcFloat:Float}', '/version/4e8')).toEqual(
      {
        match: true,
        params: {
          floatyMcFloat: 4e8,
        },
      }
    )

    expect(
      matchPath('/version/{floatyMcFloat:Float}', '/version/noMatchMe')
    ).toEqual({
      match: false,
    })
  })

  it('transforms a param for Globs', () => {
    expect(
      matchPath('/version/{globbyMcGlob...}', '/version/path/to/file')
    ).toEqual({
      match: true,
      params: {
        'globbyMcGlob...': 'path/to/file',
      },
    })
  })

  it('handles multiple typed params', () => {
    expect(
      matchPath(
        '/dashboard/document/{id:Int}/{version:Float}/edit/{edit:Boolean}/{path...}/terminate',
        '/dashboard/document/44/1.8/edit/false/path/to/file/terminate'
      )
    ).toEqual({
      match: true,
      params: { id: 44, version: 1.8, edit: false, 'path...': 'path/to/file' },
    })
  })
})

describe('validatePath', () => {
  it.each(['invalid/route', '{id}/invalid/route', ' /invalid/route'])(
    'rejects "%s" path that does not begin with a slash',
    (path) => {
      expect(validatePath.bind(null, path)).toThrowError(
        `Route path does not begin with a slash: "${path}"`
      )
    }
  )

  it.each([
    '/path/to/user profile',
    '/path/ to/userprofile',
    '/path/to /userprofile',
    '/path/to/users/{id: Int}',
    '/path/to/users/{id :Int}',
    '/path/to/users/{id : Int}',
    '/path/to/users/{ id:Int}',
    '/path/to/users/{id:Int }',
    '/path/to/users/{ id:Int }',
    '/path/to/users/{ id : Int }',
  ])('rejects paths with spaces: "%s"', (path) => {
    expect(validatePath.bind(null, path)).toThrowError(
      `Route path contains spaces: "${path}"`
    )
  })

  it.each([
    '/users/{id}/photos/{id}',
    '/users/{id}/photos/{id:Int}',
    '/users/{id:Int}/photos/{id}',
    '/users/{id:Int}/photos/{id:Int}',
  ])('rejects path "%s" with duplicate params', (path) => {
    expect(validatePath.bind(null, path)).toThrowError(
      `Route path contains duplicate parameter: "${path}"`
    )
  })

  it.each([
    '/users/{id:Int}/photos/{photo_id:Int}',
    '/users/{id}/photos/{photo_id}',
    '/users/{id}/photos/{photo_id}?format=jpg&w=400&h=400',
    '/',
    '/404',
    '/about',
    '/about/redwood',
  ])('validates correct path "%s"', (path) => {
    expect(validatePath.bind(null, path)).not.toThrow()
  })
})

describe('parseSearch', () => {
  it('deals silently with an empty search string', () => {
    expect(parseSearch('')).toEqual({})
  })

  it('correctly parses a search string', () => {
    expect(
      parseSearch('?search=all+dogs+go+to+heaven&category=movies')
    ).toEqual({ category: 'movies', search: 'all dogs go to heaven' })
  })
})

describe('flattenSearchParams', () => {
  it('returns a flat array from query string', () => {
    expect(
      flattenSearchParams('?search=all+dogs+go+to+heaven&category=movies')
    ).toEqual([{ search: 'all dogs go to heaven' }, { category: 'movies' }])
  })

  it('returns an empty array', () => {
    expect(flattenSearchParams('')).toEqual([])
  })
})

describe('replaceParams', () => {
  it('replaces named parameter with value from the args object', () => {
    expect(replaceParams('/tags/{tag}', { tag: 'code' })).toEqual('/tags/code')
  })

  it('replaces multiple named parameters with values from the args object', () => {
    expect(
      replaceParams('/posts/{year}/{month}/{day}', {
        year: '2021',
        month: '09',
        day: '19',
      })
    ).toEqual('/posts/2021/09/19')
  })

  it('appends extra parameters as search parameters', () => {
    expect(replaceParams('/extra', { foo: 'foo' })).toEqual('/extra?foo=foo')
    expect(replaceParams('/tags/{tag}', { tag: 'code', foo: 'foo' })).toEqual(
      '/tags/code?foo=foo'
    )
  })

  it('handles falsy parameter values', () => {
    expect(replaceParams('/category/{categoryId}', { categoryId: 0 })).toEqual(
      '/category/0'
    )

    expect(replaceParams('/boolean/{bool}', { bool: false })).toEqual(
      '/boolean/false'
    )

    expect(replaceParams('/undef/{undef}', { undef: undefined })).toEqual(
      '/undef/undefined'
    )
  })
})
