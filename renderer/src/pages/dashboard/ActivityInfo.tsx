import BorderedBox from 'src/components/BorderedBox'
import Text from 'src/components/Text'
import useCheckerActivity from 'src/hooks/CheckerActivity'
import WarningIcon from 'src/assets/img/icons/warning.svg?react'
import JobIcon from 'src/assets/img/icons/job.svg?react'
import { Activity } from 'shared/typings'
import dayjs from 'dayjs'
import { useMemo } from 'react'

const ActivityItem = ({ activity }: {activity: Activity}) => {
  return (
    <div className="flex gap-[10px] py-2" key={activity.id} data-testid="activity-item">
      {activity.type === 'info'
        ? <JobIcon className="btn-icon-primary-small" />
        : <WarningIcon className="btn-icon-primary-small" />}

      <div className='flex-1 relative top-[1px] flex flex-col gap-1'>
        <Text size='2xs' >{activity.message}</Text>
        <Text size='3xs' color='secondary'>{dayjs(activity.timestamp).format('HH:mm')}</Text>
      </div>

    </div>
  )
}

const ActivityInfo = () => {
  const { totalJobs, activities } = useCheckerActivity()

  const activitiesByDate = useMemo(() => activities
    .sort((x, y) => y.timestamp.getTime() - x.timestamp.getTime())
    .reduce<Record<string, Activity[]>>((groups, activity) => {
    const date = dayjs(activity.timestamp).format('YYYY-MM-DD')
    return {
      ...groups,
      [date]: groups[date] ? groups[date].concat(activity) : [activity]
    }
  }, {})
  , [activities])

  return (
    <>
      <BorderedBox className='p-5'>
        <Text as='h3' font='mono' size='3xs' color='primary' uppercase className='mb-3'>
            Jobs completed ... :
        </Text>
        <Text font='mono' size='s' data-testid="jobs-counter" color="white">{totalJobs.toLocaleString()}</Text>
      </BorderedBox>
      <div className='h-full flex flex-col relative'>
        <BorderedBox
          className='p-5 flex-1 activity-log overflow-hidden'
          isGrouped
        >
          <Text as='h3' font='mono' size='3xs' color='primary' uppercase>
            Activity ... :
          </Text>
          <div className="overflow-y-scroll custom-scrollbar h-full bottom-0 absolute top-[50px]">
            {Object.entries(activitiesByDate).map(([date, log]) => (
              <div key={date}>
                <Text size='3xs' color='secondary'>{date}</Text>
                {log.map(activity => <ActivityItem activity={activity} key={activity.id} />)}
              </div>
            ))}
          </div>
        </BorderedBox>
      </div>
    </>
  )
}

export default ActivityInfo
