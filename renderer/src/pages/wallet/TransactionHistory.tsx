import dayjs from 'dayjs'
import { formatFilValue, openExplorerLink, truncateString } from 'src/lib/utils'
import { FILTransaction } from 'shared/typings'
import Text from 'src/components/Text'
import SendIcon from 'src/assets/img/icons/send.svg?react'
import ReceiveIcon from 'src/assets/img/icons/receive.svg?react'
import classNames from 'classnames'
import CheckerIllustration from 'src/assets/img/Group 138681.svg?react'
import LinkOut from 'src/assets/img/icons/link-out.svg?react'
import { useEffect, useRef, useState } from 'react'
import Transition from 'src/components/Transition'

const TransactionHistory = ({
  walletTransactions
}: {
  walletTransactions?: Array<FILTransaction>;
}) => {
  const [completeTransactions, setCompleteTransactions] = useState<
  Array<FILTransaction & { isNew?: boolean }>
  >()
  const transactionsRef = useRef<string[]>(undefined)

  useEffect(() => {
    const complete = walletTransactions?.filter(tx => tx.status !== 'processing')

    if (complete?.length !== transactionsRef.current?.length) {
      setCompleteTransactions(complete?.map((tx) => ({
        ...tx,
        isNew: transactionsRef.current && !transactionsRef.current.includes(tx.hash) && !!completeTransactions
      })))
    }
  }, [walletTransactions, completeTransactions])

  transactionsRef.current = completeTransactions?.map(tx => tx.hash) || []

  return (
    <Transition
      on={!!walletTransactions}
      className='absolute inset-0 top-2 flex flex-col h-[98%] overflow-y-scroll custom-scrollbar'
    >
      {completeTransactions && completeTransactions?.length > 0
        ? completeTransactions?.map((transaction) => (
          <button
            type='button'
            onClick={() => openExplorerLink(transaction.hash)}
            key={transaction.hash}
            className={classNames({
              'pr-4': completeTransactions?.length > 5,
              'animate-fradeFromBlue': transaction.isNew
            }, 'flex gap-4 text-left px-5 py-2 group hover:bg-slate-100 focus:bg-slate-100 focus:outline-none')}
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
          <div className='flex flex-col items-center justify-center text-center flex-1'>
            <figure className='flex mb-[5%]'>
              <CheckerIllustration className='m-auto' />
            </figure>
            <Text as="p" size='2xs' className='mb-1 opacity-50' font='title'>No transfers yet</Text>
            <Text as="p" className='max-w-[210px] opacity-50' size='2xs'>
            After your first transaction you will be able to view it here
            </Text>
          </div>
        )}
    </Transition>
  )
}

export default TransactionHistory
