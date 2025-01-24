import type { Meta, StoryObj } from '@storybook/react'

import { Loading, Empty, Failure, Success } from './ContactsCell'
import { standard } from './ContactsCell.mock'

const meta: Meta = {
  title: 'Cells/ContactsCell',
  tags: ['autodocs'],
}

export default meta

export const loading: StoryObj<typeof Loading> = {
  render: () => {
    return Loading ? <Loading /> : <></>
  },
}

export const failure: StoryObj<typeof Failure> = {
  render: (args) => {
    return Failure ? <Failure error={new Error('Oh no')} {...args} /> : <></>
  },
}

export const empty: StoryObj<typeof Empty> = {
  render: (args) => {
    return Empty ? <Empty {...args} /> : <></>
  },
}

export const success: StoryObj<typeof Success> = {
  render: (args) => {
    return Success ? <Success {...standard()} {...args} /> : <></>
  },
}
