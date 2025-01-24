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

import Posts from './Posts'

const meta: Meta<typeof Posts> = {
  component: Posts,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof Posts>

export const Primary: Story = {}
