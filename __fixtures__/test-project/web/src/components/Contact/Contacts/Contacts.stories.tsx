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

import Contacts from './Contacts'

const meta: Meta<typeof Contacts> = {
  component: Contacts,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof Contacts>

export const Primary: Story = {}
