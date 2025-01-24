import type { Meta, StoryObj } from '@storybook/react'

import PostPage from './PostPage'

const meta: Meta<typeof PostPage> = {
  component: PostPage,
}

export default meta

type Story = StoryObj<typeof PostPage>

export const Primary: Story = {}
