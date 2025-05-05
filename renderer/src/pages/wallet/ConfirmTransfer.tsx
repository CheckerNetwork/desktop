import BorderedBox from 'src/components/BorderedBox'
import Button from 'src/components/Button'
import Text from 'src/components/Text'
import { Wallet } from 'src/hooks/CheckerWallet'
import { formatFilValue } from 'src/lib/utils'

const ConfirmTransfer = ({
  walletBalance,
  hide,
  transferAllFundsToDestinationWallet
}: {
  walletBalance: Wallet['walletBalance'];
  hide: () => void;
  transferAllFundsToDestinationWallet: Wallet['transferAllFundsToDestinationWallet'];
}) => {
  return (
    <BorderedBox className='relative flex flex-col gap-5 bg-white p-5 w-[80%] mx-auto mt-[170px] text-center'>
      <Text as="p" size='s'>
          Send <strong>{formatFilValue(walletBalance)}</strong> to the destination address?
      </Text>
      <div className='flex gap-5 justify-center'>
        <Button
          type='button'
          variant='primary'
          onClick={hide}
          className='bg-white text-primary'
        >
          <Text font='mono' size='2xs' color='primary'>Cancel</Text>
        </Button>
        <Button
          type='button'
          variant='primary'
          onClick={() => {
            transferAllFundsToDestinationWallet()
            hide()
          }}
        >
          Transfer
        </Button>
      </div>
    </BorderedBox>
  )
}

export default ConfirmTransfer
