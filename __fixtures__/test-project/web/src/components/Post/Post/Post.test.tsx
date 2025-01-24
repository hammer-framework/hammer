import { render } from '@redwoodjs/testing/web'

import Post from './Post'
import { standard } from './Post.mock'

//   Improve this test with help from the Redwood Testing Doc:
//    https://redwoodjs.com/docs/testing#testing-components

describe('Post', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<Post post={standard().post} />)
    }).not.toThrow()
  })
})
