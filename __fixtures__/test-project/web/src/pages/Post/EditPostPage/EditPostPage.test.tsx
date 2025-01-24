import { render } from '@redwoodjs/testing/web'

import EditPostPage from './EditPostPage'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('EditPostPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<EditPostPage id="42" />)
    }).not.toThrow()
  })
})
