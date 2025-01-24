import { render } from '@redwoodjs/testing/web'

import NewPost from './NewPost'

//   Improve this test with help from the Redwood Testing Doc:
//    https://redwoodjs.com/docs/testing#testing-components

describe('NewPost', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<NewPost />)
    }).not.toThrow()
  })
})
