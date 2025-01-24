// Pass props to your component by passing an `args` object to your story
//
// ```tsx
// export const Primary: Story = {
//  args: {
//    propName: propValue
//  }
// }
// ```
//
// See https://storybook.js.org/docs/react/writing-stories/args.

import type { Meta, StoryObj } from '@storybook/react'

import NewContact from './NewContact'

const meta: Meta<typeof NewContact> = {
  component: NewContact,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof NewContact>

export const Primary: Story = {}
