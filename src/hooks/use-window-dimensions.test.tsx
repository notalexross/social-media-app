import { act, render, screen, waitFor } from '@testing-library/react'
import useWindowDimensions from './use-window-dimensions'

function Component() {
  const [windowWidth, windowHeight] = useWindowDimensions()

  return <div>{`width: ${windowWidth}, height: ${windowHeight}`}</div>
}

function resizeTo(width: number, height: number) {
  global.innerWidth = width
  global.innerHeight = height

  const event = document.createEvent('Event')
  event.initEvent('resize', true, true)
  window.dispatchEvent(event)
}

beforeEach(() => {
  resizeTo(1024, 768)
  render(<Component />)
})

test('returns window dimensions', () => {
  expect(screen.getByText('width: 1024, height: 768')).toBeInTheDocument()
})

test('on window height change, returns new window dimensions', async () => {
  act(() => resizeTo(1024, 500))

  await waitFor(() => {
    expect(screen.getByText('width: 1024, height: 500')).toBeInTheDocument()
  })
})

test('on window width change, returns new window dimensions', async () => {
  act(() => resizeTo(500, 768))

  await waitFor(() => {
    expect(screen.getByText('width: 500, height: 768')).toBeInTheDocument()
  })
})

test('on window width and height change, returns new window dimensions', async () => {
  act(() => resizeTo(100, 200))

  await waitFor(() => {
    expect(screen.getByText('width: 100, height: 200')).toBeInTheDocument()
  })
})
