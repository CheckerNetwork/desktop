import { truncateString } from 'src/lib/utils'
import Text from './Text'
import CopyIcon from 'src/assets/img/icons/copy.svg?react'
import Tooltip from './Tooltip'
import { useRef, useState } from 'react'

const Address = ({
  address
}: {
  address: string;
}) => {
  const [isTextCopied, setIsTextCopied] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    event.preventDefault()

    navigator.clipboard.writeText(address)
    setIsTextCopied(true)

    const timeouts = [
      setTimeout(() => {
        triggerRef.current?.blur()
      }, 700),
      setTimeout(() => {
        setIsTextCopied(false)
      }, 800)
    ]

    return () => {
      for (const timeout of timeouts) {
        clearTimeout(timeout)
      }
    }
  }

  return (
    <div className='w-fit flex gap-1 items-center p-1 rounded-sm'>
      <Tooltip
        content={isTextCopied ? 'Copied' : 'Copy'}
        keepOpenOnClick
        trigger={
          <button
            ref={triggerRef}
            onClick={handleClick}
            type='button'
            className='focus:ring-0 focus-visible:outline-none'
          >
            <CopyIcon />
          </button>
        }
      />
      <div className='leading-none focus:bg-slate-100
                      focus:ring-0 focus-visible:outline-none'
      >
        <Text size="2xs" font="mono">{truncateString(address)}</Text>
      </div>
    </div>
  )
}

export default Address
