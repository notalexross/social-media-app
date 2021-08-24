import { useCallback, useState } from 'react'

function getLineHeight(element: HTMLElement): number {
  element.style.position = 'absolute'
  element.style.visibility = 'hidden'
  element.innerHTML = '<p>&nbsp;</p>'
  const heightSingle = element.getBoundingClientRect().height
  element.innerHTML = '<p>&nbsp;\n&nbsp;</p>'
  const heightDouble = element.getBoundingClientRect().height
  element.innerHTML = ''
  const lineHeight = heightDouble - heightSingle

  return lineHeight
}

export default function useLineHeight(): [
  number | null,
  (props: React.ComponentPropsWithoutRef<'div'>) => JSX.Element
] {
  const [lineHeight, setLineHeight] = useState<number | null>(null)

  const LineHeightComponent = (props: React.ComponentPropsWithoutRef<'div'>) => {
    const lineHeightRef = useCallback((node: HTMLDivElement | null) => {
      setLineHeight(node && getLineHeight(node))
    }, [])

    return <div ref={lineHeightRef} {...props} />
  }

  return [lineHeight, LineHeightComponent]
}
