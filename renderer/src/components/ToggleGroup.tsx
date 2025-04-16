import { Root, Item, ToggleGroupSingleProps, ToggleGroupItemProps } from '@radix-ui/react-toggle-group'
import { ReactNode } from 'react'
import Text from './Text'

type ToggleGroupButtonProps = {
  children: ReactNode;
  value: string;
} & ToggleGroupItemProps

const ToggleGroupButton = ({
  children,
  value,
  ...props
}: ToggleGroupButtonProps
) => {
  return (
    <Item
      className="min-w-[30px] data-[state=on]:bg-purple"
      value={value}
      {...props}
    >
      <Text font='mono' size='3xs' color={props.disabled ? 'white' : 'gray'}>{children}</Text>
    </Item>
  )
}

type ToggleGroupProps = {children: ReactNode} & Omit<ToggleGroupSingleProps, 'type'>

const ToggleGroup = ({
  children,
  ...props
}: ToggleGroupProps) => {
  return (
    <Root
      className='flex gap-2 p-[3px] border border-gray'
      type='single'
      {...props}
    >
      {children}
    </Root>
  )
}

export { ToggleGroupButton, ToggleGroup }
