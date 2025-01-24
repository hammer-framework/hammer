// Define your own mock data here:
export const standard = (/* vars, { ctx, req } */) => ({
  contacts: [
    {
      __typename: 'Contact',
      id: 42,
      name: 'String',
      email: 'String',
      message: 'String',
    },
    {
      __typename: 'Contact',
      id: 43,
      name: 'String',
      email: 'String',
      message: 'String',
    },
  ],
})
