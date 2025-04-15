import { Root, Portal, Content, Arrow, Trigger } from '@radix-ui/react-tooltip'
import classNames from 'classnames'
import { ComponentProps, ReactNode, useEffect, useState } from 'react'

const sizeClassNames = {
  s: 'py-1 px-2 w-fit text-body-xxs',
  m: 'p-4 w-[232px] text-body-xs'
}
const bgClassNames = {
  light: 'bg-white text-black',
  dark: 'bg-black text-white'
}

type ContentProps = ComponentProps<typeof Content>
type TooltipProps = ContentProps & {
  open?: boolean;
  content: ReactNode;
  trigger: ReactNode;
  size?: 's' | 'm';
  bg?: 'light' | 'dark';
  keepOpenOnClick?: boolean;
}

const Tooltip = ({
  open: receivedOpen,
  content,
  trigger,
  size = 's',
  bg = 'dark',
  keepOpenOnClick,
  ...contentProps
}: TooltipProps) => {
  const [isOpen, setIsOpen] = useState(receivedOpen)

  const contentClassName = classNames(
    sizeClassNames[size],
    bgClassNames[bg],
    ` rounded select-none pointer-events-none z-10
     data-[state=delayed-open]:animate-fadeIn data-[state=closed]:animate-fadeOut`
  )

  useEffect(() => {
    setIsOpen(receivedOpen)
  }, [receivedOpen])

  return (
    <Root open={isOpen} onOpenChange={setIsOpen}>
      <Trigger asChild>
        {trigger}
      </Trigger>
      <Portal>
        <Content
          className={contentClassName}
          sideOffset={4}
          onPointerDownOutside={(event: CustomEvent<{ originalEvent: PointerEvent }>) => {
            if (keepOpenOnClick) event.preventDefault()
          }}
          {...contentProps}
        >
          {content}
          <Arrow height={8} width={10} className={bg === 'dark' ? 'fill-black' : 'fill-white'} />
        </Content>
      </Portal>
    </Root>
  )
}

export default Tooltip
