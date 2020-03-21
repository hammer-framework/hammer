import { matchPath } from '../util'

describe('matchPath', () => {
  it('matches paths correctly', () => {
    expect(matchPath('/post/{id:Int}', '/post/7')).toEqual({
      match: true,
      params: { id: 7 },
    })

    expect(
      matchPath('/blog/{year}/{month}/{day}', '/blog/2019/12/07')
    ).toEqual({ match: true, params: { day: '07', month: '12', year: '2019' } })

    expect(matchPath('/about', '/')).toEqual({ match: false })
  })

  it('transforms a param based on the specified transform', () => {
    expect(matchPath('/post/{id}', '/post/1337')).toEqual({
      match: true,
      params: { id: '1337' },
    })

    expect(matchPath('/post/{id:Int}', '/post/1337')).toEqual({
      match: true,
      params: { id: 1337 },
    })
  })
})
