import { useState, useEffect } from 'react'
import {
  getActivities,
  getTotalJobsCompleted
} from 'src/lib/checker-config'
import { Activity } from 'src/typings'

interface CheckerActivity {
  totalJobs: number;
  activities: Activity[] | [];
}
const useCheckerActivity = (): CheckerActivity => {
  const [totalJobs, setTotalJobs] = useState<number>(0)
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    const loadStoredInfo = async () => setActivities(await getActivities())
    loadStoredInfo()
  }, [])

  useEffect(() => {
    const loadStoredInfo = async () => setTotalJobs(await getTotalJobsCompleted())
    loadStoredInfo()
  }, [])

  useEffect(() => {
    const unsubscribeOnJobProcessed = window.electron.checkerEvents.onJobProcessed(setTotalJobs)
    return () => {
      unsubscribeOnJobProcessed()
    }
  }, [])

  useEffect(() => {
    const unsubscribeOnActivityLogged = window.electron.checkerEvents.onActivityLogged(activity => {
      setActivities(activities => {
        const updatedActivities = [activity, ...activities]
        updatedActivities.length = Math.min(updatedActivities.length, 100)
        return updatedActivities
      })
    })
    return () => {
      unsubscribeOnActivityLogged()
    }
  }, [])

  return { totalJobs, activities }
}

export default useCheckerActivity
