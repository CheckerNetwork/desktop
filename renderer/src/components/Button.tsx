import classNames from 'classnames'
import { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

const DEFAULT_ELEMENT = 'button'

type ButtonOwnProps<C> = {
  variant: 'primary' | 'secondary';
  icon?: ReactNode;
  as?: C;
  children: ReactNode;
}

type ButtonProps<C extends ElementType = typeof DEFAULT_ELEMENT>
    = ButtonOwnProps<C> & ComponentPropsWithoutRef<C>

const variantClassNames = {
  primary: 'py-2 px-6 bg-primary text-black disabled:text-slate-400',
  secondary: 'py-2 px-6 text-primary outline-1 outline outline-primary disabled:text-blue-300'
}

const Button = <C extends ElementType = typeof DEFAULT_ELEMENT>({
  variant,
  as,
  icon,
  children,
  ...props
}: ButtonProps<C>) => {
  const Component = as || DEFAULT_ELEMENT

  const className = classNames(
    `flex gap-2 items-center font-mono text-mono-2xs rounded-[28px] 
     focus:ring ring-slate-400 focus:outline-0 disabled:cursor-not-allowed`,
    variantClassNames[variant],
    props.className
  )

  return (
    <Component {...props} className={className}>
      {icon}
      {children}
    </Component>
  )
}

export default Button
