// In this file, all Page components from 'src/pages` are auto-imported. Nested
// directories are supported, and should be uppercase. Each subdirectory will be
// prepended onto the component name.
//
// Examples:
//
// 'src/pages/HomePage/HomePage.js'         -> HomePage
// 'src/pages/Admin/BooksPage/BooksPage.js' -> AdminBooksPage

import { Router, Route, Set } from '@redwoodjs/router'
import { serve } from '@redwoodjs/vite/client'

import NavigationLayout from './layouts/NavigationLayout/NavigationLayout'
import ScaffoldLayout from './layouts/ScaffoldLayout/ScaffoldLayout'
import NotFoundPage from './pages/NotFoundPage/NotFoundPage'

const AboutPage = serve('AboutPage')
const HomePage = serve('HomePage')
const UserExampleUserExamplesPage = serve('UserExampleUserExamplesPage')

const Routes = () => {
  return (
    <Router>
      <Set wrap={ScaffoldLayout} title="UserExamples" titleTo="userExamples" buttonLabel="New UserExample" buttonTo="newUserExample">
        {/* <Route path="/user-examples/new" page={UserExampleNewUserExamplePage} name="newUserExample" />
        <Route path="/user-examples/{id:Int}/edit" page={UserExampleEditUserExamplePage} name="editUserExample" />
        <Route path="/user-examples/{id:Int}" page={UserExampleUserExamplePage} name="userExample" /> */}
        <Route path="/user-examples" page={UserExampleUserExamplesPage} name="userExamples" />
      </Set>
      <Set wrap={NavigationLayout}>
        <Route path="/" page={HomePage} name="home" />
        <Route path="/about" page={AboutPage} name="about" />
      </Set>
      <Route notfound page={NotFoundPage} />
    </Router>
  )
}

export default Routes
