import ReactDOM from 'react-dom'

import App from '~redwood-app-root'
/**
 * When `#redwood-app` isn't empty then it's very likely that you're using
 * prerendering. So React attaches event listeners to the existing markup
 * rather than replacing it.
 * https://reactjs.org/docs/react-dom.html#hydrate
 */
const rootElement = document.getElementById('redwood-app')
const prerenderEl = document.getElementById('redwood-app-prerendered')

if (prerenderEl) {
  ReactDOM.hydrate(<App />, prerenderEl)
} else {
  ReactDOM.render(<App />, rootElement)
}
