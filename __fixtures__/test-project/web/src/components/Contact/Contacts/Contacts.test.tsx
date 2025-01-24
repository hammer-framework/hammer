import { render } from '@redwoodjs/testing/web'

import Contacts from './Contacts'
import { standard } from './Contacts.mock'

//   Improve this test with help from the Redwood Testing Doc:
//    https://redwoodjs.com/docs/testing#testing-components

describe('Contacts', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<Contacts contacts={standard().contacts} />)
    }).not.toThrow()
  })
})
