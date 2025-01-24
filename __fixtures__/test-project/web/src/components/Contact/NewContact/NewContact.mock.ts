// Define your own mock data here:
export const standard = (/* vars, { ctx, req } */) => ({
  contact: {
    __typename: 'Contact',
    id: 42,
    name: 'String',
    email: 'String',
    message: 'String',
  },
})
