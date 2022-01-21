/* eslint-disable import/prefer-default-export */
import styled, { css, keyframes } from 'styled-components'

const animation = (open: boolean, from: 'top' | 'right' | 'bottom' | 'left') => {
  let transform: string

  switch (from) {
    case 'top':
      transform = 'translate(0, -100%)'
      break
    case 'right':
      transform = 'translate(100%, 0)'
      break
    case 'bottom':
      transform = 'translate(0, 100%)'
      break
    case 'left':
      transform = 'translate(-100%, 0)'
      break
    default:
      throw new Error('Must specify a direction to transition from.')
  }

  return keyframes`
    0% {
      transform: ${open ? transform : 'translate(0, 0)'};
      opacity: ${open ? 0 : 1};
    }

    100% {
      transform: ${open ? 'translate(0, 0)' : transform};
      opacity: ${open ? 1 : 0};
    }
  `
}

export const Container = styled.div<{
  open: boolean
  openDuration: number
  closeDuration: number
  from: 'top' | 'right' | 'bottom' | 'left'
}>`
  ${({ open, openDuration, closeDuration, from }) => {
    const duration = open ? openDuration : closeDuration

    return css`
      animation: ${animation(open, from)} ${duration}ms;
      animation-fill-mode: both;
    `
  }}
`
