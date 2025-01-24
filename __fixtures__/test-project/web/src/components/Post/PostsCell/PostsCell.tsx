import type { FindPosts, FindPostsVariables } from 'types/graphql'

import { Link, routes } from '@redwoodjs/router'
import type {
  CellSuccessProps,
  CellFailureProps,
  TypedDocumentNode,
} from '@redwoodjs/web'

import Posts from 'src/components/Post/Posts'

export const QUERY: TypedDocumentNode<FindPosts, FindPostsVariables> = gql`
  query FindPosts {
    posts {
      id
      title
      body
      authorId
      createdAt
      author {
        id
        # Add the author fields you need here
      }
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => {
  return (
    <div className="rw-text-center">
      No posts yet.{' '}
      <Link to={routes.newPost()} className="rw-link">
        Create one?
      </Link>
    </div>
  )
}

export const Failure = ({ error }: CellFailureProps<FindPosts>) => (
  <div className="rw-cell-error">{error?.message}</div>
)

export const Success = ({
  posts,
}: CellSuccessProps<FindPosts, FindPostsVariables>) => {
  return <Posts posts={posts} />
}
