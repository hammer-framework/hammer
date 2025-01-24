// Define your own mock data here:
export const standard = (/* vars, { ctx, req } */) => ({
  post: {
    __typename: 'Post',
    id: 42,
    title: 'String',
    body: 'String',
    author: {
      create: {
        email: 'String10',
        hashedPassword: 'String',
        fullName: 'String',
        salt: 'String',
      },
    },
  },
})
