import type { Meta, StoryObj } from '@storybook/react'

import PostsPage from './PostsPage'

const meta: Meta<typeof PostsPage> = {
  component: PostsPage,
}

export default meta

type Story = StoryObj<typeof PostsPage>

export const Primary: Story = {}
