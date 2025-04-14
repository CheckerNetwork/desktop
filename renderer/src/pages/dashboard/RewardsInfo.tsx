import Text from 'src/components/Text'
import { formatFilValue } from 'src/lib/utils'
import InfoIcon from 'src/assets/img/icons/icon info.svg?react'
import Tooltip from 'src/components/Tooltip'

const RewardsInfo = ({
  totalRewardsReceived,
  scheduledRewards
}: {
  totalRewardsReceived: number;
  scheduledRewards?: string;
}) => {
  return (
    <section className="flex justify-between">
      <div className='p-5 flex flex-col gap-2'>
        <Text as="p" font='mono' size='3xs' color='primary' uppercase className='flex'>
            &#47;&#47; REWARDS RECEIVED SINCE JUNE 13TH 2024 ... :
          <Tooltip
            trigger={
              <i><InfoIcon className='text-primary relative -top-3' /></i>
            }
            style={{ maxWidth: '230px' }}
            content={`At the moment, rewards from before June 13th 2024 are not
              included in this dashboard. Data will be backfilled soon.`}
          />
        </Text>
        <Text as='p' font='mono' size='xl' data-testid="earnings-counter" color="white">
          {formatFilValue(totalRewardsReceived.toString())}{' '}FIL
        </Text>
      </div>

      <div className='border-l border-b border-[#6B6B6B] border-opacity-50 rounded-bl-lg flex p-5 min-w-[237px]'>
        <div className='flex flex-col gap-2 m-auto'>
          <Text as="p" font='mono' size='3xs' color='primary' uppercase className='flex'>
            &#47;&#47; Next payout ... :
            <Tooltip
              trigger={
                <i><InfoIcon className='text-primary relative -top-3' /></i>
              }
              style={{ maxWidth: '230px' }}
              content={`This is the reward total you have accrued since your last payout.
              Scheduled earning will be sent to your Checker Wallet approximately once a week,
              provided you have earned more than the payout threshold.`}
            />

          </Text>
          <Text as='p' font='mono' size='s' color='white'>
            {formatFilValue(scheduledRewards)}{' '}FIL
          </Text>
        </div>
      </div>
    </section>
  )
}

export default RewardsInfo
