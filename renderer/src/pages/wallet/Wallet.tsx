import useWallet from 'src/hooks/CheckerWallet'
import { formatFilValue, openExplorerLink } from 'src/lib/utils'
import TransactionHistory from './TransactionHistory'
import BorderedBox from 'src/components/BorderedBox'
import Text from 'src/components/Text'
import Address from 'src/components/Address'
import LinkOut from 'src/assets/img/icons/link-out.svg?react'
import TransferWrapper from './TransferWrapper'

const Wallet = () => {
  const {
    walletBalance,
    checkerAddress,
    checkerAddress0x,
    walletTransactions,
    destinationFilAddress,
    editDestinationAddress,
    transferAllFundsToDestinationWallet,
    processingTransaction
  } = useWallet()

  return (
    <div className='w-full grid grid-rows-[auto_1fr] grid-cols-[1fr_1fr]'>
      <div className='px-9 mt-28 flex flex-col gap-5 animate-fadeIn'>
        <BorderedBox className='p-5 flex flex-col gap-2'>
          <Text font='mono' size='3xs' color='primary' uppercase>
              Checker wallet balance ... :
          </Text>
          <Text font='mono' size='s'>{formatFilValue(walletBalance)}{' '}FIL</Text>
        </BorderedBox>
        <BorderedBox className='p-5 flex flex-col gap-2'>
          <Text font='mono' size='3xs' color='primary' uppercase>Checker address ... :</Text>
          <div className='flex gap-5 items-center'>
            <Address address={checkerAddress} />
            <Address address={checkerAddress0x} />
            <button
              type='button'
              className='text-primary ml-auto focus:outline-slate-400 w-5 h-5'
              onClick={() => openExplorerLink(checkerAddress)}
            >
              <LinkOut />
            </button>
          </div>
        </BorderedBox>
      </div>

      <TransferWrapper
        walletBalance={walletBalance}
        destinationFilAddress={destinationFilAddress}
        editDestinationAddress={editDestinationAddress}
        transferAllFundsToDestinationWallet={transferAllFundsToDestinationWallet}
        checkerAddress={checkerAddress}
        processingTransaction={processingTransaction}
      />

      <div className='px-9 flex flex-col my-5 mb-10'>
        <BorderedBox className='p-5 flex flex-col gap-2' isGrouped tabIndex={2}>
          <Text font='mono' size='3xs' color='primary' uppercase>
                Transaction history ... :
          </Text>
        </BorderedBox>
        <BorderedBox className='flex flex-col gap-2 flex-1 relative' isGrouped>
          <TransactionHistory walletTransactions={walletTransactions || []} />
        </BorderedBox>
      </div>
    </div>
  )
}

export default Wallet
