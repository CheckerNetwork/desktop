import { useEffect, useState, useCallback } from 'react'
import {
  getAllActivities, stopSaturnNode, startSaturnNode,
  setFilAddress, getFilAddress,
  getTotalEarnings, getTotalJobsCompleted
} from '../lib/station-config'
import { ActivityEventMessage } from '../typings'
import ActivityLog from '../components/ActivityLog'
import HeaderBackgroundImage from '../assets/img/header.png'
import WalletIcon from '../assets/img/wallet.svg'
import { useNavigate } from 'react-router-dom'

const Dashboard = (): JSX.Element {
  const navigate = useNavigate()

  const [address, setAddress] = useState<string | undefined>()
  const [totalJobs, setTotalJobs] = useState<number>(0)
  const [totalEarnings, setTotalEarnigs] = useState<number>(0)
  const [activities, setActivities] = useState<ActivityEventMessage[]>([])
  const shortAddress = (str: string | undefined) => str
    ? str.substring(0, 4) + '...' + str.substring(str.length - 4, str.length)
    : ''
  const disconnect = async () => {
    // TODO: move disconnect logic to backend
    await stopSaturnNode()
    await setFilAddress('').then(
      () => { setAddress(undefined); navigate('/', { replace: true }) }
    )
  }
  
  const reload = async (): Promise<void> => {
    setAddress(await getFilAddress())
    setActivities(await getAllActivities())
    setTotalEarnigs(await getTotalEarnings())
    setTotalJobs(await getTotalJobsCompleted())
  }

  const handleActivity = useCallback((value: ActivityEventMessage) => {
    setActivities(activities => activities ? [...activities, value] : [value])
  }, [])

  const handleEarnings = useCallback((value: number) => {
    setTotalEarnigs((counter) => counter ? counter + value : value)
  }, [])

  const handleJobs = useCallback((value: number) => {
    setTotalJobs((counter) => counter ? counter + value : value)
  }, [])

  useEffect(() => { document.title = 'Dashboard' })

  useEffect(() => {
    reload()
    startSaturnNode()
    const unsubscribeOnActivityLogged = window.electron.stationEvents.onActivityLogged(handleActivity)
    const unsubscribeOnEarningsChanged = window.electron.stationEvents.onEarningsChanged(handleEarnings)
    const unsubscribeOnJobProcessed = window.electron.stationEvents.onJobProcessed(handleJobs)

    return () => {
      stopSaturnNode()
      unsubscribeOnActivityLogged()
      unsubscribeOnEarningsChanged()
      unsubscribeOnJobProcessed()
    }
  }, [handleActivity, handleEarnings, handleJobs])

  return (
    <div className="h-screen w-screen overflow-hidden bg-grayscale-100">
      <div className="relative">

        <div className="max-w-[744px] mx-auto">
          <div className="absolute left-0 z-0 top-0 w-full h-[300px]"
            style={{
              backgroundImage: `url(${HeaderBackgroundImage})`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: '50% 0',
              WebkitMaskImage: 'linear-gradient(black, transparent)',
              maskImage: 'linear-gradient(black, transparent)'
            }}>
          </div>
          <div className="h-[300px] flex flex-col relative z-10">
            <div className="flex-grow flex pt-4 justify-end justify-items-end">
              <div>
                <button type="button" className="flex items-center cursor-pointer" title="logout" onClick={disconnect}>
                  <img src={WalletIcon} alt=""/>
                  <span className="text-right mx-3 fil-address" title="fil address">{shortAddress(address)}</span>
                  <span className="underline text-primary">Change Wallet</span>
                </button>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-body-3xs text-grayscale-700 uppercase">Total Jobs Completed</p>
              <p className="text-header-m font-bold font-number total-jobs" title="total jobs">{totalJobs}</p>
            </div>
            <div className="mb-6">
              <p className="text-body-3xs text-grayscale-700 uppercase">Total Earnings (updated daily)</p>
              <p className="text-header-m font-bold font-number total-earnings" title="total earnings">
                {totalEarnings > 0 ? totalEarnings : '--'}
                {totalEarnings > 0 ? <span className="text-header-3xs">FIL</span> : ''}
              </p>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute h-14 bg-grayscale-100 w-full z-20"
          style={{
            WebkitMaskImage: 'linear-gradient(black, transparent)',
            maskImage: 'linear-gradient(black, transparent)'
          }}>
        </div>
        <div tabIndex={0} className="h-screen overflow-y-auto pt-12 relative z-10">
          <div className="max-w-[744px] mx-auto overflow-hidden">
            <ActivityLog activities={activities} />
          </div>
        </div>
        <div className="pointer-events-none absolute h-14 bg-grayscale-100 w-full z-10 bottom-0"
          style={{
            WebkitMaskImage: 'linear-gradient(transparent, black)',
            maskImage: 'linear-gradient(transparent, black)'
          }}>
        </div>
      </div>
    </div>
  )
}

export default Dashboard