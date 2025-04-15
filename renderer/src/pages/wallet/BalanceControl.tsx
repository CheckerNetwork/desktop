import Button from 'src/components/Button'
import Text from 'src/components/Text'
import { formatFilValue, truncateString } from 'src/lib/utils'
import { Wallet } from 'src/hooks/CheckerWallet'
import Tooltip from 'src/components/Tooltip'
import { ReactNode, useState } from 'react'
import Transition from 'src/components/Transition'
import TransactionStatusIndicator from 'src/components/TransactionStatusIndicator'
import classNames from 'classnames'

const TooltipWrapper = ({ children, hasTooltip }: {children: ReactNode; hasTooltip: boolean}) => {
  if (!hasTooltip) return children

  return (
    <Tooltip
      style={{ maxWidth: '232px' }}
      content={`Once your rewards reach the minimum amount, you can transfer them. 
    Check back to see when you can make your next transfer.`}
      size='s'
      bg='light'
      sideOffset={10}
      trigger={(
        <span>{children}</span>
      )}
    />
  )
}

const BalanceControl = ({
  walletBalance = '',
  sendThreshold,
  processingTransaction,
  destinationFilAddress,
  transferAllFundsToDestinationWallet
}: {
  walletBalance?: string;
  sendThreshold: number;
  processingTransaction: Wallet['processingTransaction'];
  destinationFilAddress: Wallet['destinationFilAddress'];
  transferAllFundsToDestinationWallet: Wallet['transferAllFundsToDestinationWallet'];
}) => {
  const [isShowingConfirm, setIsShowingConfirm] = useState(false)
  const hasSufficientBalance = Number(walletBalance) >= sendThreshold

  return (
    <Transition
      on={!isShowingConfirm}
      inClass='w-[260px] h-[260px] rounded-[130px] border-primary bg-black'
      outClass='bg-white w-[500px] max-w-[80%] p-5 rounded-[8px] h-[132px]'
      className='border border-dashed mx-auto balance-control'
      data-testid='balance-control'
    >
      <div className={'h-full z-10 flex'}>
        <Transition
          on={isShowingConfirm}
          unmountOnEnd
          delayIn={200}
          className='flex flex-col gap-5 text-center m-auto'
        >
          <Text as="p" size='s'>
              Send <strong>{formatFilValue(walletBalance)} FIL</strong> to {' '}
            <strong>{truncateString(destinationFilAddress || '')}</strong>?
          </Text>
          <div className='flex gap-5 justify-center'>
            <Button
              type='button'
              variant='primary'
              onClick={() => setIsShowingConfirm(false)}
              className='bg-white text-primary'
            >
              <Text font='mono' size='2xs' color='primary'>Cancel</Text>
            </Button>
            <Button
              type='button'
              variant='primary'
              onClick={() => {
                transferAllFundsToDestinationWallet()
                setIsShowingConfirm(false)
              }}
            >
              Transfer
            </Button>
          </div>

        </Transition>

        <Transition
          on={!isShowingConfirm}
          delayIn={200}
          unmountOnEnd
          className='m-auto flex flex-col gap-5 items-center justify-center h-full'
        >
          <div className='flex flex-col justify-end h-[55%]'>
            <Text
              size="m"
              bold
              className={classNames('text-slate-50 text-center',
                formatFilValue(walletBalance).length > 8 ? 'text-[1.85rem]' : 'text-[2rem]'
              )}
            >
              {formatFilValue(walletBalance)} FIL
            </Text>
          </div>
          <div className='h-[45%] flex flex-col'>
            {!processingTransaction && (
              <TooltipWrapper hasTooltip={!hasSufficientBalance}>
                <Button
                  type='button'
                  variant='primary'
                  onClick={() => setIsShowingConfirm(true)}
                  disabled={!hasSufficientBalance}
                  className='bg-purple'
                >
                Transfer
                </Button>
              </TooltipWrapper>
            )}
            <TransactionStatusIndicator transaction={processingTransaction} theme='dark' />
          </div>
        </Transition>
      </div>
    </Transition>
  )
}

export default BalanceControl
