/* eslint-disable react/jsx-no-comment-textnodes */
import { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'
import classNames from 'classnames'

const DEFAULT_ELEMENT = 'span'

type TextOwnProps<C> = {
  size?: '3xs' | '2xs' | 'xs' | 's' | 'm' | 'l' | 'xl' | '2xl';
  font?: 'title' | 'body' | 'mono';
  bold?: boolean;
  color?: 'black' | 'secondary' | 'primary' | 'white';
  uppercase?: boolean;
  as?: C;
  children: ReactNode;
}

type TextProps<C extends ElementType = typeof DEFAULT_ELEMENT>
    = TextOwnProps<C> & ComponentPropsWithoutRef<C>

const Text = <C extends ElementType = typeof DEFAULT_ELEMENT>({
  size = 's',
  font = 'body',
  color = 'black',
  uppercase,
  bold,
  as,
  children,
  ...props
}: TextProps<C>) => {
  const Component = as || DEFAULT_ELEMENT

  const className = classNames(
    `text-${font}-${size}`,
    `font-${font}`,
    `text-${color}`,
    {
      uppercase,
      'font-bold': bold && (font === 'title' || font === 'mono'),
      'font-medium': bold && font === 'body',
      'text-slate-800': color === 'secondary'
    },
    props.className
  )

  return (
    <Component {...props} className={className}>{children}</Component>
  )
}

export default Text
