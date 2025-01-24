import { render } from '@redwoodjs/testing/web'

import PostPage from './PostPage'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('PostPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<PostPage id="42" />)
    }).not.toThrow()
  })
})
