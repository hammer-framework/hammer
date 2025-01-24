import type { Meta, StoryObj } from '@storybook/react'

import ContactsPage from './ContactsPage'

const meta: Meta<typeof ContactsPage> = {
  component: ContactsPage,
}

export default meta

type Story = StoryObj<typeof ContactsPage>

export const Primary: Story = {}
