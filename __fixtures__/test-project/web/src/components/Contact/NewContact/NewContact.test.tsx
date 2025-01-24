import { render } from '@redwoodjs/testing/web'

import NewContact from './NewContact'

//   Improve this test with help from the Redwood Testing Doc:
//    https://redwoodjs.com/docs/testing#testing-components

describe('NewContact', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<NewContact />)
    }).not.toThrow()
  })
})
