import { render } from '@testing-library/react'
import useTitle from './use-title'

function Component({ page }: { page?: string }) {
  useTitle(page)

  return null
}

test('given no arguments, sets document title to value stored in environment', () => {
  render(<Component />)

  expect(document.title).toBe(process.env.REACT_APP_SITE_TITLE)
})

test('sets document title to value stored in environment with page name appended', () => {
  render(<Component page="sign up" />)

  expect(document.title).toBe(`sign up - ${process.env.REACT_APP_SITE_TITLE || ''}`)
})
