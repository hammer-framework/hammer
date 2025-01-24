import { render } from '@redwoodjs/testing/web'

import Posts from './Posts'
import { standard } from './Posts.mock'

//   Improve this test with help from the Redwood Testing Doc:
//    https://redwoodjs.com/docs/testing#testing-components

describe('Posts', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<Posts posts={standard().posts} />)
    }).not.toThrow()
  })
})
