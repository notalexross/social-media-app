import { BrowserRouter as Router } from 'react-router-dom'
import { render } from '@testing-library/react'
import App from './App'

test('renders', () => {
  render(
    <Router>
      <App />
    </Router>
  )
})
