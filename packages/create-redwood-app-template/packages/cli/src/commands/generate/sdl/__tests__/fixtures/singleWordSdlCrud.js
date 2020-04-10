export const schema = gql`
  type Post {
    id: Int!
    title: String!
    slug: String!
    author: String!
    body: String!
    image: String
    postedAt: DateTime
  }

  type Query {
    posts: [Post]
    post(id: Int!): Post
  }

  input PostInput {
    title: String
    slug: String
    author: String
    body: String
    image: String
    postedAt: DateTime
  }

  type Mutation {
    createPost(input: PostInput!): Post
    updatePost(id: Int!, input: PostInput!): Post
    deletePost(id: Int!): Post
  }
`
