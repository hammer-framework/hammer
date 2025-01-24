import { render } from '@redwoodjs/testing/web'

import ContactPage from './ContactPage'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('ContactPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<ContactPage id="42" />)
    }).not.toThrow()
  })
})
