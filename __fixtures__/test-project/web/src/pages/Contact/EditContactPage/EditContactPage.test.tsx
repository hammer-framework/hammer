import { render } from '@redwoodjs/testing/web'

import EditContactPage from './EditContactPage'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('EditContactPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<EditContactPage id="42" />)
    }).not.toThrow()
  })
})
