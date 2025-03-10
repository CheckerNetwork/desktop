import { useMemo, useState } from 'react'
import { RewardsRecord } from 'src/hooks/CheckerRewards'
import Chart from './Chart'
import { Select, SelectItem } from 'src/components/Select'
import { ToggleGroup, ToggleGroupButton } from 'src/components/ToggleGroup'

const timeRanges = ['7d', '1m', '1y', 'all'] as const
export type TimeRange = typeof timeRanges[number]

const timeRangeInDays = {
  '7d': 7,
  '1m': 31,
  '1y': 365
}

function getDataInTimeRange (data: RewardsRecord[], timeRange: TimeRange) {
  if (timeRange === 'all') {
    return data
  }

  const currentDate = new Date()
  const cutOffDate = new Date().setDate(currentDate.getDate() - timeRangeInDays[timeRange])

  return data.filter(record => new Date(record.timestamp).getTime() > cutOffDate)
}

const ChartController = ({ historicalRewards }: {historicalRewards: RewardsRecord[]}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const [subnetId, setSubnetId] = useState('all')

  const filteredHistoricalRewards = useMemo(
    () => getDataInTimeRange(historicalRewards, timeRange),
    [timeRange, historicalRewards]
  )

  const subnetIdsInRange = useMemo(
    () => filteredHistoricalRewards.reduce<string[]>(
      (acc, record) => [
        ...acc,
        ...Object.keys(record.totalScheduledRewards).filter((id) => !acc.includes(id))
      ], ['All subnets']
    ), [filteredHistoricalRewards])

  return (
    <div className='flex-1 flex flex-col'>
      <div className='flex gap-4 p-5'>
        <ToggleGroup
          onValueChange={(value: TimeRange) => {
            if (value) setTimeRange(value)
          }}
          defaultValue={timeRange}
        >
          {timeRanges.map(value => (
            <ToggleGroupButton
              key={value}
              value={value}
              disabled={value === timeRange}
            >
              {value.toUpperCase()}
            </ToggleGroupButton>
          ))}
        </ToggleGroup>
        <Select
          label='Subnet'
          onValueChange={(value) => {
            setSubnetId(value === 'All subnets' ? 'all' : value)
          }}
          defaultValue='All subnets'
        >
          {subnetIdsInRange.map((id) => (
            <SelectItem
              label={id}
              value={id}
              key={id}
            />
          ))}
        </Select>
      </div>
      <section className='px-2 flex-1 flex'>
        <Chart historicalRewards={filteredHistoricalRewards} subnetId={subnetId} timeRange={timeRange} />
      </section>
    </div>
  )
}

export default ChartController
