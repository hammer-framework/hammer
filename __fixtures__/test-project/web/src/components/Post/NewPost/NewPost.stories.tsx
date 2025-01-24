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

import NewPost from './NewPost'

const meta: Meta<typeof NewPost> = {
  component: NewPost,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof NewPost>

export const Primary: Story = {}
