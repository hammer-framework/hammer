import type { Meta, StoryObj } from '@storybook/react'

import EditPostPage from './EditPostPage'

const meta: Meta<typeof EditPostPage> = {
  component: EditPostPage,
}

export default meta

type Story = StoryObj<typeof EditPostPage>

export const Primary: Story = {}
