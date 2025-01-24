import { render } from '@redwoodjs/testing/web'

import Contact from './Contact'
import { standard } from './Contact.mock'

//   Improve this test with help from the Redwood Testing Doc:
//    https://redwoodjs.com/docs/testing#testing-components

describe('Contact', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<Contact contact={standard().contact} />)
    }).not.toThrow()
  })
})
