import Text from 'src/components/Text'
import { Wallet } from 'src/hooks/CheckerWallet'
import DestinationAddressForm from './DestinationAddressForm'
import BalanceControl from './BalanceControl'
import EditDestinationAddressForm from './EditDestinationAddressForm'
import { CSSProperties, useEffect, useRef, useState } from 'react'
import Transition from 'src/components/Transition'
import GridCanvas from './GridCanvas'
import { openDocsLink } from 'src/lib/checker-config'

const SEND_THRESHOLD = 0.01

const TransferWrapper = ({
  checkerAddress,
  destinationFilAddress,
  processingTransaction,
  walletBalance,
  editDestinationAddress,
  transferAllFundsToDestinationWallet
}: {
  walletBalance: Wallet['walletBalance'];
  destinationFilAddress?: Wallet['destinationFilAddress'];
  checkerAddress?: Wallet['checkerAddress'];
  processingTransaction: Wallet['processingTransaction'];
  editDestinationAddress: Wallet['editDestinationAddress'];
  transferAllFundsToDestinationWallet: Wallet['transferAllFundsToDestinationWallet'];
}) => {
  const [isShowingEditAddress, setIsShowingAddressEdit] = useState(false)
  const inTransition = useRef(false)

  useEffect(() => {
    if (destinationFilAddress && !inTransition.current) {
      setIsShowingAddressEdit(true)
    }
  }, [destinationFilAddress])

  return (
    <section
      data-testid="transfer-wrapper"
      className={`
        row-span-2 col-start-2 bg-[#3A3A3A59] bg-opacity-35 backdrop-blur-3xl relative flex flex-col
        overflow-hidden
      `}
      style={{ '--factor': 1 } as CSSProperties}
    >
      <GridCanvas
        walletBalance={walletBalance}
        destinationFilAddress={destinationFilAddress}
        processingTransaction={processingTransaction}
      />
      {checkerAddress && (
        <>
          <Transition
            on={!destinationFilAddress}
            unmountOnEnd
            onUnmount={() => {
              inTransition.current = false
              setIsShowingAddressEdit(true)
            }}
            outClass='animate-addressFormMoveUp'
            className='absolute w-[80%] max-w-[480px] mx-auto left-0 right-0 top-[70%] -translate-y-[50%]'
            data-testid="destination-address-form-wrapper"
          >
            <DestinationAddressForm
              onSave={(value) => {
                inTransition.current = true
                editDestinationAddress(value)
              }}
              destinationFilAddress={destinationFilAddress}
            />
          </Transition>

          {isShowingEditAddress && (
            <EditDestinationAddressForm
              destinationAddress={destinationFilAddress}
              editDestinationAddress={editDestinationAddress}
            />
          )}

          <Transition
            on={isShowingEditAddress}
            unmountOnEnd
            className='absolute top-[70%] left-0 right-0 mx-auto -translate-y-[50%] balance-control-wrapper'
          >
            <BalanceControl
              walletBalance={walletBalance}
              sendThreshold={SEND_THRESHOLD}
              processingTransaction={processingTransaction}
              destinationFilAddress={destinationFilAddress}
              transferAllFundsToDestinationWallet={transferAllFundsToDestinationWallet}
            />
          </Transition>
        </>
      )}

      <footer className='relative text-center mb-9 mt-auto'>
        <Text
          size='xs'
          color='white'
          bold
          as="button"
          type='button'
          onClick={() => openDocsLink()}
          className='focus-visible:outline-slate-400'
        >
          Learn more about your Checker wallet
        </Text>
      </footer>
    </section>
  )
}

export default TransferWrapper
