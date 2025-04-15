import classNames from 'classnames'
import { ComponentPropsWithRef, forwardRef } from 'react'
import Text from './Text'
import WarningIcon from 'src/assets/img/icons/warning.svg?react'

type TextInputProps = {
  variant: 'primary' | 'secondary';
  error?: string | boolean;
} & ComponentPropsWithRef<'input'>

const variantClassNames = {
  primary: `text-black placeholder:text-secondary focus:outline-none rounded-sm
  placeholder-shown:focus-visible:ring-2 placeholder-shown:focus-visible:ring-slate-400`,
  secondary: `px-5 text-white placeholder:text-white border bg-black
  focus:ring-0 ring-0 focus:outline-1 rounded-3xl`
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function ({
  variant,
  error,
  ...props
}, ref) {
  const inputClassName = classNames(
    variantClassNames[variant],
    {
      'border-dashed border-primary focus:outline-slate-400': variant === 'secondary' && !error,
      'border-solid border-red-400 focus:outline-red-400': variant === 'secondary' && error
    },
    'py-2 text-body-xs w-full peer',
    props.className
  )

  const borderClassName = classNames({
    'border-slate-400 peer-hover:border-black peer-focus:border-black': !error,
    'border-red-400 peer-hover:border-red peer-focus:border-red': error
  }, 'w-full border-b absolute top-full')

  const errorClassName = classNames({
    'mt-2': variant === 'primary',
    'mt-3': variant === 'secondary'
  }, 'flex gap-2 items-start text-red-400')

  return (
    <div>
      <label className='relative block'>
        <input
          type="text"
          ref={ref}
          {...props}
          className={inputClassName}
        />
        {variant === 'primary' && (
          <div className={borderClassName}></div>
        )}
      </label>
      {error && (
        <div className={errorClassName}>
          <WarningIcon className='w-4 h-4 mt-[1px]' />
          <Text size='xs' color="red">{error}</Text>
        </div>
      )}
    </div>
  )
})

TextInput.displayName = 'TextInput'

export default TextInput
