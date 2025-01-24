import { render } from '@redwoodjs/testing/web'

import { Loading, Failure, Success } from './ContactCell'
import { standard } from './ContactCell.mock'

//   Improve this test with help from the Redwood Testing Doc:
//    https://redwoodjs.com/docs/testing#testing-components

describe('ContactCell', () => {
  it('renders loading successfully', () => {
    expect(() => {
      render(<Loading />)
    }).not.toThrow()
  })
  it('renders failure successfully', () => {
    expect(() => {
      render(<Failure error={new Error('Oh no')} />)
    }).not.toThrow()
  })
  it('renders successfully', () => {
    expect(() => {
      render(<Success contact={standard().contact} />)
    }).not.toThrow()
  })
})
