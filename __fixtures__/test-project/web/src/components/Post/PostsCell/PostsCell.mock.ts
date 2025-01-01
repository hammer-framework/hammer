// Define your own mock data here:
export const standard = (/* vars, { ctx, req } */) => ({
  posts: [
    {
      __typename: 'Post',
      id: 42,
      title: 'String',
      body: 'String',
      author: {
        create: {
          email: 'String1814572',
          hashedPassword: 'String',
          fullName: 'String',
          salt: 'String',
        },
      },
    },
    {
      __typename: 'Post',
      id: 43,
      title: 'String',
      body: 'String',
      author: {
        create: {
          email: 'String9023600',
          hashedPassword: 'String',
          fullName: 'String',
          salt: 'String',
        },
      },
    },
  ],
})
