import { useMutation } from '@redwoodjs/web'
import { Link, routes } from '@redwoodjs/router'

const DELETE_POST_MUTATION = gql`
  mutation DeletePostMutation($id: Int!) {
    deletePost(id: $id) {
      id
    }
  }
`

const MAX_STRING_LENGTH = 150

const truncate = (text) => {
  let output = text
  if (text && text.length > MAX_STRING_LENGTH) {
    output = output.substring(0, MAX_STRING_LENGTH) + '...'
  }
  return output
}

const timeTag = (datetime) => {
  return (
    <time dateTime={datetime} title={datetime}>
      {new Date(datetime).toUTCString()}
    </time>
  )
}

const PostsList = ({ posts }) => {
  const [deletePost] = useMutation(DELETE_POST_MUTATION)

  const onDeleteClick = (id) => {
    if (confirm('Are you sure you want to delete post ' + id + '?')) {
      deletePost({ variables: { id }, refetchQueries: ['POSTS'] })
    }
  }

  return (
    <div className="rw-segment rw-table-wrapper-responsive">
      <table className="rw-table">
        <thead>
          <tr>
            <th>id</th>
            <th>title</th>
            <th>slug</th>
            <th>author</th>
            <th>body</th>
            <th>image</th>
            <th>postedAt</th>
            <th>&nbsp;</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id}>
              <td>{truncate(post.id)}</td>
              <td>{truncate(post.title)}</td>
              <td>{truncate(post.slug)}</td>
              <td>{truncate(post.author)}</td>
              <td>{truncate(post.body)}</td>
              <td>{truncate(post.image)}</td>
              <td>{timeTag(post.postedAt)}</td>
              <td className="rw-table-actions">
                <nav>
                  <ul>
                    <li>
                      <Link
                        to={routes.post({ id: post.id })}
                        title={'Show post ' + post.id + ' detail'}
                        className="rw-button rw-button-small"
                      >
                        Show
                      </Link>
                    </li>
                    <li>
                      <Link
                        to={routes.editPost({ id: post.id })}
                        title={'Edit post ' + post.id}
                        className="rw-button rw-button-small rw-button-blue"
                      >
                        Edit
                      </Link>
                    </li>
                    <li>
                      <a
                        href="#"
                        title={'Delete post ' + post.id}
                        className="rw-button rw-button-small rw-button-red"
                        onClick={() => onDeleteClick(post.id)}
                      >
                        Delete
                      </a>
                    </li>
                  </ul>
                </nav>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default PostsList
