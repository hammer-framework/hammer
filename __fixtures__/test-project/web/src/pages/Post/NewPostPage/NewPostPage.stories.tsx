import type { Meta, StoryObj } from '@storybook/react'

import NewPostPage from './NewPostPage'

const meta: Meta<typeof NewPostPage> = {
  component: NewPostPage,
}

export default meta

type Story = StoryObj<typeof NewPostPage>

export const Primary: Story = {}
