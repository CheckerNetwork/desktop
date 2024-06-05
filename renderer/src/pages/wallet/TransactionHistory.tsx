import dayjs from 'dayjs'
import { formatFilValue, openExplorerLink, truncateString } from 'src/lib/utils'
import { FILTransaction } from 'shared/typings'
import Text from 'src/components/Text'
import SendIcon from 'src/assets/img/icons/send.svg?react'
import ReceiveIcon from 'src/assets/img/icons/receive.svg?react'
import classNames from 'classnames'
import stationIllustration from 'src/assets/img/station-illustration.png'
import LinkOut from 'src/assets/img/icons/link-out.svg?react'
import { useEffect, useRef } from 'react'

const TransactionHistory = ({
  walletTransactions = []
}: {
  walletTransactions: Array<FILTransaction>;
}) => {
  const isInitialRender = useRef(true)

  useEffect(() => {
    if (walletTransactions.length) {
      isInitialRender.current = false
    }
  }, [walletTransactions])

  return (
    <div className='flex flex-col h-[300px] overflow-y-scroll custom-scrollbar'>
      {walletTransactions?.length > 0
        ? walletTransactions?.map((transaction, idx) => (
          <button
            type='button'
            onClick={() => openExplorerLink(transaction.hash)}
            key={transaction.hash}
            className={classNames({
              'pr-4': walletTransactions && walletTransactions?.length > 5,
              'animate-fradeFromBlue': !isInitialRender.current && idx === 0
            }, 'flex gap-4 text-left px-5 py-2 group hover:bg-slate-100')}
          >
            <div className="text-inherit">
              {transaction.outgoing ? <SendIcon /> : <ReceiveIcon />}
            </div>
            <div>
              <Text size='s' as='p' style={{ color: 'inherit' }}>
                {transaction.outgoing
                  ? `Sent to ${truncateString(transaction.address)}`
                  : 'Received'}
              </Text>
              <Text
                font='mono'
                size='3xs'
                color='secondary'
              >
                {dayjs(transaction.timestamp).format('MMM D, YYYY HH:mm')}
              </Text>
            </div>
            <div className='flex flex-col ml-auto justify-between'>
              <Text
                font='mono'
                size='xs'
                className='ml-auto'
                style={{ color: 'inherit' }}
              >
                {formatFilValue(transaction.amount)} FIL
              </Text>
              <LinkOut className='ml-auto w-4 h-4 text-inherit opacity-0 group-hover:opacity-100' />
            </div>
          </button>
        ))
        : (
          <div className='flex flex-col items-center text-center flex-1'>
            <figure className='flex flex-1'>
              <img src={stationIllustration} alt='Station' className='m-auto' />
            </figure>
            <Text as="p" size='m' bold className='mb-1'>No transfers yet</Text>
            <Text as="p" className='max-w-[210px]' size='xs'>
            After your first transaction you will be able to view it here
            </Text>
          </div>
        )}
    </div>
  )
}

export default TransactionHistory
