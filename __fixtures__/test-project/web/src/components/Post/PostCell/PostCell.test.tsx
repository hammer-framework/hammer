import { render } from '@redwoodjs/testing/web'

import { Loading, Failure, Success } from './PostCell'
import { standard } from './PostCell.mock'

//   Improve this test with help from the Redwood Testing Doc:
//    https://redwoodjs.com/docs/testing#testing-components

describe('PostCell', () => {
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
      render(<Success post={standard().post} />)
    }).not.toThrow()
  })
})
