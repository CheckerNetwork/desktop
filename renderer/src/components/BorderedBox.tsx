import classNames from 'classnames'
import { ComponentPropsWithoutRef, ReactNode } from 'react'

type BorderedBoxProps = ComponentPropsWithoutRef<'div'> & {
  children: ReactNode;
  isGrouped?: boolean;
}

const BorderedBox = ({
  children,
  isGrouped,
  ...props
}: BorderedBoxProps) => {
  const className = classNames(
    {
      'first:rounded-t-md last:rounded-b-md': isGrouped,
      'rounded-md': !isGrouped
    },
    'bg-[#3A3A3A59] bg-opacity-35 backdrop-blur-3xl',
    props.className
  )

  return (
    <div {...props} className={className}>
      {children}
    </div>
  )
}

export default BorderedBox
