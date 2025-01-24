import type { Meta, StoryObj } from '@storybook/react'

import NewContactPage from './NewContactPage'

const meta: Meta<typeof NewContactPage> = {
  component: NewContactPage,
}

export default meta

type Story = StoryObj<typeof NewContactPage>

export const Primary: Story = {}
