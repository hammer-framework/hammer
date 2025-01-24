import { render } from '@redwoodjs/testing/web'

import PostForm from './PostForm'

//   Improve this test with help from the Redwood Testing Doc:
//    https://redwoodjs.com/docs/testing#testing-components

describe('PostForm', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<PostForm />)
    }).not.toThrow()
  })
})
