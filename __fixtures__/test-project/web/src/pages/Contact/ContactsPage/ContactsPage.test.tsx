import { render } from '@redwoodjs/testing/web'

import ContactsPage from './ContactsPage'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('ContactsPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<ContactsPage />)
    }).not.toThrow()
  })
})
