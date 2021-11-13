import { XIcon } from '@heroicons/react/outline'
import { Banner } from '../components'
import { useNonShiftingScrollbar } from '../hooks'

export default function DemoBanner(): JSX.Element {
  const scrollbarWidth = useNonShiftingScrollbar()

  const { REACT_APP_SHOW_DEMO_BANNER, REACT_APP_PORTFOLIO_HREF } = process.env

  if (REACT_APP_SHOW_DEMO_BANNER?.toLowerCase() !== 'true') {
    return <></>
  }

  return (
    <Banner
      className="fixed bottom-0 z-50 w-screen bg-clr-error text-clr-primary"
      transitionFrom="bottom"
      openDelay={2000}
      inDuration={1000}
      outDuration={400}
      style={{
        paddingRight: `${scrollbarWidth}px`,
        marginRight: `-${scrollbarWidth}px`
      }}
    >
      <div className="relative">
        <Banner.CloseButton
          className="absolute right-0 bottom-0 p-1 text-clr-primary rounded-t bg-clr-error bg-opacity-20 hover:text-clr-link-hover focus:text-clr-link-hover"
          aria-label="close banner"
        >
          <XIcon className="w-6" />
        </Banner.CloseButton>
      </div>
      <div className="mx-2 lg:mx-4">
        <div className="mx-auto px-3 py-3 max-w-screen-lg lg:px-4 text-center">
          <span>
            {
              'This site is for demonstration purposes only. Please be aware that posts and user data may be cleared at any time without notice. '
            }
            <a
              className="underline hover:text-clr-link-hover focus:text-clr-link-hover"
              href={REACT_APP_PORTFOLIO_HREF}
              target="_blank"
              rel="noopener noreferrer"
            >
              About me.
            </a>
          </span>
        </div>
      </div>
    </Banner>
  )
}
