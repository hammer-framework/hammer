import { render } from '@redwoodjs/testing/web'

import ContactForm from './ContactForm'

//   Improve this test with help from the Redwood Testing Doc:
//    https://redwoodjs.com/docs/testing#testing-components

describe('ContactForm', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<ContactForm />)
    }).not.toThrow()
  })
})
