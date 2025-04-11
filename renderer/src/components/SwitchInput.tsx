import { Root, Thumb } from '@radix-ui/react-switch'
import Text from './Text'
import { useId } from 'react'

type SwitchInputProps = {
  name: string;
  defaultChecked?: boolean;
  checked?: boolean;
  disabled?: boolean;
  required?: boolean;
  value?: string;
  onChange: (value: boolean) => void;
}

const SwitchInput = ({
  onChange,
  checked,
  ...props
}: SwitchInputProps) => {
  const id = useId()

  return (
    <div className={`
      flex gap-5 items-center border border-primary focus-within:ring-2
      ring-slate-400 rounded-xl w-[84px]
    `}
    >
      <Root
        id={id}
        {...props}
        className="w-[34px] h-5 bg-slate-400 rounded-full relative data-[state=checked]:bg-primary
                        outline-none cursor-default peer"
        checked={checked}
        onCheckedChange={onChange}
      >
        <Thumb className="block w-4 h-4 bg-white rounded-full shadow-switchButton
                            transition-transform duration-100 translate-x-0.5
                            will-change-transform data-[state=checked]:translate-x-4"
        />
      </Root>
      <Text
        as='label'
        htmlFor={id}
        font='mono'
        size='xs'
        color='secondary'
        className='leading-none peer-data-[state=unchecked]:hidden'
      >
            Yes
      </Text>
      <Text
        as='label'
        htmlFor={id}
        font='mono'
        size='xs'
        color='secondary'
        className='leading-none peer-data-[state=checked]:hidden'
      >
            No
      </Text>
    </div>
  )
}

export default SwitchInput
