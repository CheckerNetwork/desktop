import { Root, Trigger, Portal, Content, Item, Viewport, Value, ItemText, Icon } from '@radix-ui/react-select'
import { ComponentProps, ReactNode } from 'react'
import ArrowIcon from 'src/assets/img/icons/arrow.svg?react'
import Text from './Text'

type SelectRootProps = ComponentProps<typeof Root>

const Select = ({
  label,
  children,
  ...rest
}: {
  label: string;
  children: ReactNode;
} & SelectRootProps) => {
  return (
    <Root {...rest}>
      <Trigger className={`group focus-visible:outline-slate-400
                            border border-slate-400 min-w-[197px] text-left uppercase`}
      >
        <div className='font-mono text-body-xs px-4 py-[6px] flex items-center'>
          <Value placeholder={label} />
          <Icon className='ml-auto group-data-[state=open]:rotate-180' asChild>
            <ArrowIcon />
          </Icon>
        </div>
      </Trigger>

      <Portal>
        <Content
          position='popper'
          sideOffset={8}
          className={'bg-black group border border-slate-400 min-w-[197px] text-left'}
        >
          <Viewport>
            {children}
          </Viewport>
        </Content>
      </Portal>
    </Root>
  )
}

type SelectItemProps = {
  label: string;
  value: string;
} & ComponentProps<typeof Item>

const SelectItem = ({
  label,
  value,
  ...rest
}: SelectItemProps) => {
  return (
    <Item
      value={value}
      className={`px-4 py-[6px] hover:bg-purple
                  hover:outline-none focus-within:outline-slate-400 hover:ring-0`}
    >
      <ItemText >
        <Text size='xs'>{label}</Text>
      </ItemText>
    </Item>
  )
}

export { Select, SelectItem }
