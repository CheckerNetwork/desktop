import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react'
import { useDialog } from 'src/components/DialogProvider'
import useWallet from 'src/hooks/CheckerWallet'
import { validateAddress, addressIsF1 } from 'src/lib/utils'
import ConfirmationDialog from './ConfirmationDialog'

const TransferForm = () => {
  const { destinationFilAddress, editDestinationAddress, transferAllFundsToDestinationWallet } = useWallet()
  const { openDialog } = useDialog()
  const { walletBalance } = useWallet()

  const [formState, setFormState] = useState<'edit' | 'transfer'>()
  const [addressIsValid, setAddressIsValid] = useState(true)
  const [address, setAddress] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (destinationFilAddress) {
      setAddress(destinationFilAddress)
      setFormState('transfer')
    }
  }, [destinationFilAddress])

  useEffect(() => {
    if (formState === 'edit') {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(0, inputRef.current.value.length)
    }
  }, [formState])

  async function handleInputChange (event: ChangeEvent<HTMLInputElement>) {
    if (event.target.value === '') {
      setAddressIsValid(true)
    } else {
      setAddressIsValid(await validateAddress(event.target.value))
    }

    setAddress(event.target.value)
  }

  function handleEditClick () {
    setFormState('edit')
  }

  async function handleSaveAddress (event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (addressIsValid) {
      editDestinationAddress(address)
      setFormState('transfer')
    }
  }

  function handleTransfer (event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    openDialog({
      content: (
        <ConfirmationDialog
          amount={walletBalance || ''}
          destination={destinationFilAddress || ''}
          onProceed={transferAllFundsToDestinationWallet}
        />
      )
    })
  }

  const hasAddressSaved = destinationFilAddress && formState === 'transfer'
  const hasBalance = Number(walletBalance) >= 0.01

  return (
    <div>
      <p className='font-bold'>Transfer Destination address</p>

      <form onSubmit={hasAddressSaved ? handleTransfer : handleSaveAddress}>
        <div className='my-4'>
          <input
            name='address'
            className='border-b p-2'
            type="text"
            placeholder="Destination"
            defaultValue={address}
            onChange={handleInputChange}
            ref={inputRef}
            disabled={formState !== 'edit'}
          />
        </div>

        {hasAddressSaved && (
          <button type='button' onClick={handleEditClick} className='block my-2'>Edit</button>
        )}

        {addressIsValid && addressIsF1(address) && (
          <p>The FIL address entered is invalid. Please check and try again.</p>
        )}

        {!addressIsValid && (
          <p>The FIL address entered is invalid. Please check and try again.</p>
        )}

        {hasAddressSaved
          ? (
            <button
              type='submit'
              className='block disabled:opacity-30'
              disabled={!addressIsValid || !hasBalance}
            >
                Transfer
            </button>
          )
          : (
            <button
              type='submit'
              className='block disabled:opacity-30'
              disabled={!addressIsValid}
            >
                Save
            </button>
          )}
      </form>

    </div>
  )
}

export default TransferForm
