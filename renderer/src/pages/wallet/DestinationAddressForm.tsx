import Button from 'src/components/Button'
import Text from 'src/components/Text'
import TextInput from 'src/components/TextInput'
import Transition from 'src/components/Transition'
import { Wallet } from 'src/hooks/CheckerWallet'
import useAddressValidation from 'src/hooks/useAddressValidation'

const DestinationAddressForm = ({
  onSave,
  destinationFilAddress
}: {
  onSave: (value: string) => void;
  destinationFilAddress: Wallet['destinationFilAddress'];
}) => {
  const { inputRef, validateOnChange, inputState } = useAddressValidation({ initialValid: false })

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()

    if (inputRef.current) {
      onSave(inputRef.current.value)
    }
  }

  const hasAddressSaved = !!destinationFilAddress

  return (
    <Transition
      as='form'
      onSubmit={handleSubmit}
      on={!hasAddressSaved}
      outClass='bg-black scale-95 p-[1px] border-0'
      inClass='bg-white max-h-[208px] border-slate-400 p-5'
      className={`flex flex-col overflow-hidden
      border border-dashed rounded-lg destination-address-form`}
      data-testid="destination-address-form"
    >
      <Transition
        on={!hasAddressSaved}
        inClass='h-[20px] mb-5'
        outClass='h-[0]'
        className='overflow-hidden destination-address-form-info'
      >
        <Text as='p' bold size='s' color='black'>Enter a destination to transfer your FIL</Text>
      </Transition>

      <TextInput
        ref={inputRef}
        variant={hasAddressSaved ? 'secondary' : 'primary'}
        placeholder='Destination address'
        name='destinationAddress'
        className='destination-address-form-input'
        onChange={validateOnChange}
        error={inputState.error}
        spellCheck={false}
        data-testid="destination-address-form-input"
      />

      <Transition
        on={!hasAddressSaved}
        inClass='h-[46px] mt-5'
        outClass='h-[0]'
        className='flex overflow-hidden destination-address-form-info'
      >
        <Button
          variant='primary'
          className='w-fit m-auto'
          disabled={!inputState.isValid}
          type='submit'
        >
          Save
        </Button>
      </Transition>
    </Transition>
  )
}

export default DestinationAddressForm
