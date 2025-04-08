import { FILTransactionProcessing } from '../../../shared/typings'
import Text from './Text'
import CheckmarkIcon from 'src/assets/img/icons/checkmark.svg?react'
import LoadingIcon from 'src/assets/img/icons/loading.svg?react'
import WarningIcon from 'src/assets/img/icons/warning.svg?react'
import { ReactNode } from 'react'
import classNames from 'classnames'

const StatusWrapper = ({
  icon,
  text,
  theme
} : {
  icon: ReactNode;
  text: string;
  theme: 'light' | 'dark';
}) => (
  <div className='flex gap-2 items-center'>
    {icon}
    <Text
      as='p'
      size={theme === 'dark' ? '2xs' : 's'}
      color={theme === 'dark' ? 'white' : 'black'}
      font={theme === 'dark' ? 'mono' : 'body'}
    >
      {text}
    </Text>
  </div>
)

const TransactionStatusIndicator = ({
  transaction,
  theme = 'dark'
}: {
  transaction?: FILTransactionProcessing;
  theme?: 'light' | 'dark';
}) => {
  if (transaction?.status === 'processing') {
    return (
      <StatusWrapper
        theme={theme}
        icon={
          <LoadingIcon className={classNames('animate-spin', theme === 'light' ? 'text-primary' : 'text-white')} />
        }
        text={transaction?.outgoing ? 'Sending...' : 'Receiving...'}
      />
    )
  }

  if (transaction?.status === 'succeeded') {
    return (
      <StatusWrapper
        theme={theme}
        icon={
          <CheckmarkIcon
            className={classNames(theme === 'light' ? 'text-white fill-primary' : 'text-white fill-white')}
          />
        }
        text={transaction?.outgoing ? 'Sent' : 'Received'}
      />
    )
  }

  if (transaction?.status === 'failed') {
    return (
      <StatusWrapper
        theme={theme}
        icon={<WarningIcon className='text-red-400' />}
        text="Failed"
      />
    )
  }

  return null
}

export default TransactionStatusIndicator
