import classNames from 'classnames'
import { ReactNode } from 'react'

type TagProps = {
  children: ReactNode;
  type: 'primary' | 'secondary' | 'dashed';
}

const typeClassName = {
  primary: 'bg-primary text-black',
  secondary: 'text-gray border border-gray',
  dashed: 'bg-white border border-dashed border-primary text-primary'
}

const Tag = ({
  children,
  type
}: TagProps) => {
  const className = classNames(
    typeClassName[type],
    'py-1 px-4 w-fit text-center rounded-[36px] text-mono-3xs font-mono'
  )

  return (
    <div className={className}>
      {children}
    </div>
  )
}

export default Tag
