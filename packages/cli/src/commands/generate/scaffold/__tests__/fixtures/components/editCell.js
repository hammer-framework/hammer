import { useMutation, toast } from '@redwoodjs/web'
import { navigate, routes } from '@redwoodjs/router'
import PostForm from 'src/components/PostForm'

export const QUERY = gql`
  query FIND_POST_BY_ID($id: Int!) {
    post: post(id: $id) {
      id
      title
      slug
      author
      body
      image
      isPinned
      readTime
      rating
      postedAt
      metadata
    }
  }
`
const UPDATE_POST_MUTATION = gql`
  mutation UpdatePostMutation($id: Int!, $input: UpdatePostInput!) {
    updatePost(id: $id, input: $input) {
      id
      title
      slug
      author
      body
      image
      isPinned
      readTime
      rating
      postedAt
      metadata
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Success = ({ post }) => {
  const [updatePost, { loading, error }] = useMutation(UPDATE_POST_MUTATION, {
    onCompleted: () => {
      toast.success('Post updated')
      navigate(routes.posts())
    },
  })

  const onSave = (input, id) => {
    updatePost({ variables: { id, input } })
  }

  return (
    <div className="rw-segment">
      <header className="rw-segment-header">
        <h2 className="rw-heading rw-heading-secondary">Edit Post {post.id}</h2>
      </header>
      <div className="rw-segment-main">
        <PostForm post={post} onSave={onSave} error={error} loading={loading} />
      </div>
    </div>
  )
}
