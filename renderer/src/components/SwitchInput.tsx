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
      ring-slate-400 rounded-xl
    `}
    >
      <Root
        id={id}
        {...props}
        className="w-[50px] h-5 bg-black data-[state=checked]:bg-primary rounded-full relative
                        outline-none cursor-default peer"
        checked={checked}
        onCheckedChange={onChange}
      >
        <Thumb className="block w-4 h-4 bg-white rounded-full shadow-switchButton
                            transition-transform duration-100 translate-x-0.5
                            will-change-transform data-[state=checked]:translate-x-[31px]
                            data-[state=checked]:bg-black data-[state=unchecked]:bg-primary"
        />
      </Root>
      <Text
        as='label'
        htmlFor={id}
        font='mono'
        size='3xs'
        color='black'
        className='leading-none peer-data-[state=unchecked]:hidden text-black absolute ml-[6px]'
      >
            Yes
      </Text>
      <Text
        as='label'
        htmlFor={id}
        font='mono'
        size='3xs'
        color='secondary'
        className='leading-none peer-data-[state=checked]:hidden text-primary absolute ml-6'
      >
            No
      </Text>
    </div>
  )
}

export default SwitchInput
