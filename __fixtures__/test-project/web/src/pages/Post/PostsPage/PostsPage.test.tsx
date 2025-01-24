import { render } from '@redwoodjs/testing/web'

import PostsPage from './PostsPage'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('PostsPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<PostsPage />)
    }).not.toThrow()
  })
})
