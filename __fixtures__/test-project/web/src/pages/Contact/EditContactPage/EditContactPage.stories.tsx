import type { Meta, StoryObj } from '@storybook/react'

import EditContactPage from './EditContactPage'

const meta: Meta<typeof EditContactPage> = {
  component: EditContactPage,
}

export default meta

type Story = StoryObj<typeof EditContactPage>

export const Primary: Story = {}
