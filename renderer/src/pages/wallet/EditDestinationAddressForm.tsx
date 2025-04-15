import { useEffect, useState } from 'react'
import Text from 'src/components/Text'
import TextInput from 'src/components/TextInput'
import useWallet from 'src/hooks/CheckerWallet'
import EditIcon from 'src/assets/img/icons/edit.svg?react'
import Button from 'src/components/Button'
import useAddressValidation from 'src/hooks/useAddressValidation'
import Tooltip from 'src/components/Tooltip'
import Transition from 'src/components/Transition'

const EditDestinationAddressForm = ({
  destinationAddress,
  editDestinationAddress
}: {
  destinationAddress: ReturnType<typeof useWallet>['destinationFilAddress'];
  editDestinationAddress: ReturnType<typeof useWallet>['editDestinationAddress'];
}) => {
  const [editing, setEditing] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const { inputRef, validateOnChange, inputState } = useAddressValidation({ initialValid: true })

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()

    if (!editing) {
      setEditing(true)

      return
    }

    editDestinationAddress(inputRef.current?.value)
    setEditing(false)
    setShowTooltip(true)
    inputRef.current?.blur()

    const timeout = setTimeout(() => {
      setShowTooltip(false)
    }, 700)

    return () => clearTimeout(timeout)
  }

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length)
    } else {
      inputRef.current?.blur()
    }
  }, [editing, inputRef])

  return (
    <div className='absolute left-0 right-0 mx-auto top-[30%] scale-95 -translate-y-[50%]'>
      <form onSubmit={handleSubmit} className="flex flex-col w-[80%] max-w-[480px] mx-auto z-10">
        <Transition on className='absolute -top-[32px]'>
          <Text uppercase font="mono" size="3xs" color="primary">Destination address ... :</Text>
        </Transition>

        <div className='relative'>
          <Tooltip
            open={showTooltip}
            trigger={<div className='absolute h-0 bottom-0 w-full'></div>}
            content="Saved"
            side='bottom'
          />
          <TextInput
            ref={inputRef}
            variant='secondary'
            defaultValue={destinationAddress}
            onChange={validateOnChange}
            error={inputState.error}
            disabled={!editing}
            spellCheck={false}
          />

          {editing
            ? (
              <Transition on className='absolute right-0 top-[125%]'>
                <Button
                  variant='primary'
                  type='submit'
                  className='ml-auto py-[4px]'
                  disabled={!inputState.isValid}
                >
                  Save
                </Button>
              </Transition>
            )
            : (
              <Transition on className='absolute right-0 top-[130%]'>
                <button
                  type='submit'
                  className='py-[2px] flex items-center gap-2 text-white focus-visible:outline-slate-400'
                  onClick={() => setEditing(true)}
                >
                  <EditIcon />
                  <Text size="xs" bold color='white'>Edit</Text>
                </button>
              </Transition>
            )}

        </div>

      </form>
    </div>
  )
}

export default EditDestinationAddressForm
