import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Container } from './styles'

type BannerContextValue = {
  close: () => void
}

const BannerContext = createContext({} as BannerContextValue)

type BannerProps = {
  transitionFrom?: 'top' | 'right' | 'bottom' | 'left'
  openDelay?: number
  inDuration?: number
  outDuration?: number
} & React.ComponentPropsWithoutRef<'div'>

export default function Banner({
  transitionFrom = 'top',
  openDelay = 1000,
  inDuration = 1000,
  outDuration = 1000,
  ...restProps
}: BannerProps): JSX.Element {
  const [isOpen, setIsOpen] = useState<null | boolean>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const close = () => {
    setIsTransitioning(true)
    setIsOpen(false)
  }

  const open = useCallback(() => {
    setIsTransitioning(true)
    setIsOpen(true)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      open()
    }, openDelay)

    return () => clearTimeout(timeout)
  }, [open, openDelay])

  useEffect(() => {
    let timeout: NodeJS.Timeout

    if (isOpen !== null) {
      timeout = setTimeout(
        () => {
          setIsTransitioning(false)
        },
        isOpen ? inDuration : outDuration
      )
    }

    return () => clearTimeout(timeout)
  }, [inDuration, outDuration, isOpen])

  if (!isOpen && !isTransitioning) {
    return <></>
  }

  return (
    <BannerContext.Provider value={{ close }}>
      <Container
        open={isOpen || false}
        openDuration={inDuration}
        closeDuration={outDuration}
        from={transitionFrom}
        {...restProps}
      />
    </BannerContext.Provider>
  )
}

Banner.CloseButton = function BannerClosebutton(props: React.ComponentPropsWithoutRef<'button'>) {
  const { close } = useContext(BannerContext)

  return <button type="button" onClick={close} {...props} />
}
