import { render } from '@redwoodjs/testing/web'

import NewContactPage from './NewContactPage'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('NewContactPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<NewContactPage id="42" />)
    }).not.toThrow()
  })
})
