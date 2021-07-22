import { useRef, useState } from 'react'
import { UserCircleIcon as UserIcon } from '@heroicons/react/outline'
import Skeleton from 'react-loading-skeleton'
import { updateAvatar } from '../../services/firebase'

type AvatarImageWrapperProps = {
  children: React.ReactNode
  uid?: string
  updatable?: boolean
} & React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLButtonElement & HTMLDivElement>,
  HTMLButtonElement & HTMLDivElement
>

function AvatarImageWrapper({
  children,
  uid,
  updatable = false,
  ...restProps
}: AvatarImageWrapperProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = ({ target }) => {
    if (target.files?.length && uid) {
      setIsUpdating(true)
      updateAvatar(uid, target.files[0])
        .catch(console.error)
        .finally(() => setIsUpdating(false))
    }
  }

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = () => {
    inputRef.current?.click()
  }

  return updatable && uid ? (
    <>
      <button
        {...restProps}
        type="button"
        onClick={handleClick}
        aria-label="upload new avatar"
      >
        <input
          ref={inputRef}
          className="hidden"
          type="file"
          accept="image/*"
          onChange={handleChange}
          data-testid="upload"
        />
        {isUpdating ? (
          <div className="opacity-50" data-testid="updating">
            {children}
          </div>
        ) : (
          children
        )}
      </button>
    </>
  ) : (
    <div {...restProps}>{children}</div>
  )
}

type AvatarProps = {
  src?: string | null
  uid?: string
  alt?: string
  updatable?: boolean
} & React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>

export default function Avatar({
  src,
  uid,
  alt = '',
  updatable = false,
  ...restProps
}: AvatarProps): JSX.Element {
  let image: JSX.Element | null = null
  if (src) {
    image = <img className="w-full h-full object-cover" src={src} alt={alt} data-testid="image" />
  } else if (src === null) {
    image = <UserIcon role="img" aria-label={alt} data-testid="icon" />
  }

  return (
    <div {...restProps}>
      <div className="relative pt-1/1">
        <AvatarImageWrapper
          className="absolute inset-0 w-full h-full rounded-full bg-gray-200 overflow-hidden"
          uid={uid}
          updatable={updatable}
        >
          {image || <Skeleton circle height="100%" width="100%" style={{ display: 'block' }} />}
        </AvatarImageWrapper>
      </div>
    </div>
  )
}
