import useWallet from 'src/hooks/CheckerWallet'
import { useDialog } from './DialogProvider'
import BorderedBox from './BorderedBox'
import Text from './Text'
import Address from './Address'
import { formatFilValue, openExplorerLink } from 'src/lib/utils'
import Button from './Button'
import { Link } from 'react-router'
import { ROUTES } from 'src/lib/routes'
import LinkOutIcon from 'src/assets/img/icons/link-out.svg?react'
import CloseIcon from 'src/assets/img/icons/close.svg?react'
import TransactionStatusIndicator from './TransactionStatusIndicator'

const WalletModal = () => {
  const {
    checkerAddress,
    checkerAddress0x,
    walletBalance,
    processingTransaction
  } = useWallet()
  const { closeDialog } = useDialog()

  return (
    <>
      <BorderedBox isGrouped className='flex p-5 justify-end'>
        <button
          onClick={closeDialog}
          type='button'
          className='focus-visible:outline-slate-400 focus:outline-slate-400'
        >
          <CloseIcon />
        </button>
      </BorderedBox>
      <BorderedBox isGrouped className='p-5'>
        <Text as='p' font='mono' size='3xs' color='primary' uppercase>Checker address ... :</Text>
        <div className='flex gap-5 items-center mt-4'>
          <Address address={checkerAddress} />
          <Address address={checkerAddress0x} />
          <button
            type='button'
            className='text-primary ml-auto focus:outline-slate-400 w-5 h-5'
            onClick={() => openExplorerLink(checkerAddress)}
          >
            <LinkOutIcon />
          </button>
        </div>
      </BorderedBox>
      <BorderedBox isGrouped className='p-5'>
        <Text as='p' font='mono' size='3xs' color='primary' uppercase>Balance ... :</Text>
        <div className='flex mt-4 items-center justify-between'>
          <Text as='p' font='mono' size='s' uppercase>
            {formatFilValue(walletBalance)} FIL
          </Text>
          {processingTransaction
            ? (
              <TransactionStatusIndicator transaction={processingTransaction} />
            )
            : (
              <Button as={Link} to={ROUTES.wallet} variant='primary' className='ml-auto pt-1 pb-1'>
                Transfer
              </Button>
            )}
        </div>
      </BorderedBox>
    </>
  )
}

export default WalletModal
