import useWallet from 'src/hooks/CheckerWallet'
import WalletIcon from 'src/assets/img/icons/wallet.svg?react'
import { useDialog } from './DialogProvider'
import { formatFilValue } from 'src/lib/utils'
import Text from './Text'
import WalletModal from './WalletModal'
import { ROUTES } from 'src/lib/routes'
import TransactionStatusIndicator from './TransactionStatusIndicator'
import { useLocation } from 'react-router'

const WalletWidget = () => {
  const { openDialog } = useDialog()
  const { walletBalance, processingTransaction } = useWallet()
  const { pathname } = useLocation()

  if (pathname === ROUTES.wallet) {
    return null
  }

  function handleClick () {
    openDialog({
      content: <WalletModal />
    })
  }

  return (
    <div className='absolute top-5 right-9 flex gap-5'>
      <TransactionStatusIndicator transaction={processingTransaction} />
      <button
        data-testid='wallet-widget'
        type='button'
        onClick={handleClick}
        className={`flex items-center gap-3 text-white no-drag-area z-10
        focus-visible:outline-slate-400 focus:outline-slate-400 p-1`}
      >
        <WalletIcon />
        <Text size='2xs' className="text-white">{formatFilValue(walletBalance)} FIL</Text>
      </button>
    </div>
  )
}

export default WalletWidget
