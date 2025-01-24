import { render } from '@redwoodjs/testing/web'

import NewPostPage from './NewPostPage'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('NewPostPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<NewPostPage id="42" />)
    }).not.toThrow()
  })
})
