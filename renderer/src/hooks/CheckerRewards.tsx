import { useEffect, useMemo, useState } from 'react'
import { getScheduledRewards } from 'src/lib/checker-config'
import useWallet from 'src/hooks/CheckerWallet'
import { formattedFilToBigInt } from 'src/lib/utils'
import { voyagerAirdrop } from './voyagerAirdrop'

type ScheduledRewardsResponse = {
  day: string;
  scheduled_rewards: string;
}[]

async function getHistoricalScheduledRewards (address: string) {
  const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
  const res = await fetch(
    `https://stats.filspark.com/participant/${address}/scheduled-rewards` +
      `?from=2024-01-01&to=${yesterday.toISOString().split('T')[0]}`
  )
  const stats = await res.json() as ScheduledRewardsResponse
  return stats.map(stat => ({
    timestamp: new Date(stat.day).toISOString(),
    totalScheduledRewards: {
      spark: BigInt(stat.scheduled_rewards),
      voyager: 0n
    }
  }))
}

type RewardTransfersResponse = {
  day: string;
  amount: string;
}[]

async function getHistoricalRewardTransfers (address: string) {
  const res = await fetch(
    `https://stats.filspark.com/participant/${address}/reward-transfers` +
      `?from=2024-01-01&to=${new Date().toISOString().split('T')[0]}`
  )
  const stats = await res.json() as RewardTransfersResponse
  return stats.map(stat => ({
    timestamp: new Date(stat.day).toISOString(),
    totalRewardsReceived: {
      spark: BigInt(stat.amount),
      voyager: 0n
    }
  }))
}

async function getHistoricalRewardsData (address: string) {
  const [scheduledRewards, rewardTransfers] = await Promise.all([
    getHistoricalScheduledRewards(address),
    getHistoricalRewardTransfers(address)
  ])
  const stats = scheduledRewards.map(stat => ({
    ...stat,
    totalRewardsReceived: {
      spark: 0n,
      voyager: 0n
    }
  }))
  for (const stat of rewardTransfers) {
    const existingStat = stats.find(s => s.timestamp === stat.timestamp)
    if (existingStat) {
      existingStat.totalRewardsReceived = stat.totalRewardsReceived
    } else {
      stats.push({
        ...stat,
        totalScheduledRewards: {
          spark: 0n,
          voyager: 0n
        }
      })
    }
  }
  if (Object.keys(voyagerAirdrop).includes(address)) {
    const timestamp = new Date('2024-09-17').toISOString()
    const existingStat = stats.find(s => s.timestamp === timestamp)
    if (existingStat) {
      existingStat.totalRewardsReceived.voyager = voyagerAirdrop[address]
    } else {
      stats.push({
        timestamp,
        totalRewardsReceived: {
          spark: 0n,
          voyager: voyagerAirdrop[address]
        },
        totalScheduledRewards: {
          spark: 0n,
          voyager: 0n
        }
      })
    }
  }
  stats.sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  const currentTotalRewards = {
    spark: 0n,
    voyager: 0n
  }
  for (const stat of stats) {
    currentTotalRewards.spark += stat.totalRewardsReceived.spark
    currentTotalRewards.voyager += stat.totalRewardsReceived.voyager
    stat.totalRewardsReceived.spark = currentTotalRewards.spark
    stat.totalRewardsReceived.voyager = currentTotalRewards.voyager
  }

  return stats
}

export type RewardsRecord = {
  timestamp: string;
  totalRewardsReceived: Record<string, bigint>;
  totalScheduledRewards: Record<string, bigint>;
}

export function sumAllRewards (data: RewardsRecord['totalRewardsReceived']) {
  return Object.values(data).reduce((acc, val) => acc + val, 0n)
}

const useCheckerRewards = () => {
  const wallet = useWallet()
  const [scheduledRewards, setScheduledRewards] = useState<bigint>()
  const [historicalRewards, setHistoricalRewards] = useState<RewardsRecord[]>([])

  const totalRewardsReceived = useMemo(
    () => sumAllRewards(historicalRewards.at(-1)?.totalRewardsReceived || {}),
    [historicalRewards]
  )

  useEffect(() => {
    async function loadStoredInfo () {
      if (!wallet.checkerAddress0x || document.hidden) return
      setHistoricalRewards(
        await getHistoricalRewardsData(wallet.checkerAddress0x)
      )
    }
    loadStoredInfo()
    const id = setInterval(loadStoredInfo, 20 * 60 * 1000)
    document.addEventListener('visibilitychange', loadStoredInfo)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', loadStoredInfo)
    }
  }, [wallet.checkerAddress0x])

  useEffect(() => {
    async function loadStoredInfo () {
      if (document.hidden) return
      setScheduledRewards(formattedFilToBigInt(await getScheduledRewards()))
    }
    loadStoredInfo()
    const id = setInterval(() => loadStoredInfo(), 60 * 60 * 1000)
    document.addEventListener('visibilitychange', loadStoredInfo)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', loadStoredInfo)
    }
  }, [wallet.checkerAddress0x])

  useEffect(() => {
    const unsubscribeOnScheduledRewardsUpdate = window.electron.checkerEvents.onScheduledRewardsUpdate(balance => {
      setScheduledRewards(formattedFilToBigInt(balance))
    })
    return () => {
      unsubscribeOnScheduledRewardsUpdate()
    }
  }, [])

  const historicalRewardsWithLiveToday = useMemo(() => {
    const rewards = [...historicalRewards]
    let todayRewards = rewards[rewards.length - 1]
    if (
      !todayRewards ||
      Number(todayRewards.timestamp.split('T')[0].split('-')[2]) !== new Date().getDate() ||
      Number(todayRewards.timestamp.split('T')[0].split('-')[1]) - 1 !== new Date().getMonth() ||
      Number(todayRewards.timestamp.split('T')[0].split('-')[0]) !== new Date().getFullYear()
    ) {
      todayRewards = {
        timestamp: new Date().toISOString(),
        totalRewardsReceived: {
          spark: rewards[rewards.length - 1]?.totalRewardsReceived.spark || 0n,
          voyager: rewards[rewards.length - 1]?.totalRewardsReceived.voyager || 0n
        },
        totalScheduledRewards: {
          spark: 0n,
          voyager: 0n
        }
      }
      rewards.push(todayRewards)
    }
    todayRewards.totalScheduledRewards.spark = scheduledRewards
      ? BigInt(scheduledRewards)
      : 0n
    return rewards
  }, [historicalRewards, scheduledRewards])

  return {
    historicalRewards: historicalRewardsWithLiveToday,
    scheduledRewards,
    totalRewardsReceived
  }
}

export default useCheckerRewards
