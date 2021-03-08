export default `
import { Router, Route } from '@redwoodjs/router'

const Routes = () => {
  return (
    <Router>
      <Route path="/blog-post/{id:Int}" page={BlogPostPage} name="blogPost" />
      <Route path="/posts/new" page={NewPostPage} name="newPost" />
      <Route path="/posts/{id:Int}/edit" page={EditPostPage} name="editPost" />
      <Route path="/posts/{id:Int}" page={PostPage} name="post" />
      <Route path="/posts" page={PostsPage} name="posts" />
      <Route path="/about" page={AboutPage} name="about" prerender/>
      <Route path="/" page={HomePage} name="home" prerender/>
      <Route notfound page={NotFoundPage} prerender/>
    </Router>
  )
}

export default Routes
`
