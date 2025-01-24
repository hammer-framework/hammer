import type { Meta, StoryObj } from '@storybook/react'

import ContactPage from './ContactPage'

const meta: Meta<typeof ContactPage> = {
  component: ContactPage,
}

export default meta

type Story = StoryObj<typeof ContactPage>

export const Primary: Story = {}
