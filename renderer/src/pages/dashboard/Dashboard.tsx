import BorderedBox from 'src/components/BorderedBox'
import ActivityInfo from './ActivityInfo'
import ChartController from './ChartController'
import useStationRewards from 'src/hooks/StationRewards'
import RewardsInfo from './RewardsInfo'
import { bigIntFilToNumber } from 'src/lib/utils'
import type { JSX } from 'react'

const Dashboard = (): JSX.Element => {
  const { historicalRewards, totalRewardsReceived, scheduledRewards } = useStationRewards()

  return (
    <main className='gap-5 px-9 mt-28 flex-1  grid grid-rows-[auto_1fr] grid-cols-[1fr_217px] pb-6 animate-fadeIn'>
      <BorderedBox className='flex-1 row-span-2 flex flex-col'>
        <RewardsInfo
          totalRewardsReceived={bigIntFilToNumber(totalRewardsReceived)}
          scheduledRewards={String(bigIntFilToNumber(scheduledRewards || 0n))}
        />
        <ChartController historicalRewards={historicalRewards} />
      </BorderedBox>
      <ActivityInfo />
    </main>
  )
}

export default Dashboard
