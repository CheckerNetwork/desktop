import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  getActivities,
  getDestinationWalletAddress,
  getScheduledRewards,
  getStationWalletAddress,
  getStationWalletBalance,
  getStationWalletTransactionsHistory
} from 'src/lib/station-config'
import Dashboard from 'src/pages/dashboard/Dashboard'
import useWallet from 'src/hooks/StationWallet'
import useStationActivity from 'src/hooks/StationActivity'
import { Activity } from '../../../shared/typings'
import useStationRewards from 'src/hooks/StationRewards'
import { renderApp } from './utils'

const activities: Activity[] = [{
  id: 'bb9d9a61-75e0-478d-9dd8-aa74756c39c2',
  timestamp: new Date(166386083297),
  source: 'Saturn',
  type: 'info',
  message: 'Saturn node exited with code: 2'
}]
const addToActivities = () => {
  activities.push({
    id: 'bb9d9a61-75e0-478d-9dd8-aa74756c39c3',
    timestamp: new Date(166386083298),
    source: 'Saturn',
    type: 'info',
    message: 'Saturn node exited with code: 2'
  })
}

let totalJobs = 100
const setTotalJobs = () => {
  totalJobs = 200
}

let scheduledRewards = '100'
const setScheduledRewards = () => {
  scheduledRewards = '200'
}

vi.mock('src/hooks/StationWallet')
vi.mock('src/hooks/StationActivity')
vi.mock('src/hooks/StationRewards')
vi.mock('src/lib/station-config')

vi.stubGlobal('electron', {
  stationEvents: {
    onReadyToUpdate: () => () => null
  },
  getUpdaterStatus: () => false
})

describe('Dashboard page', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('Unpopulated', () => {
    beforeAll(() => {
      vi.mocked(getStationWalletBalance).mockReturnValue(Promise.resolve('0'))
      vi.mocked(getStationWalletTransactionsHistory).mockReturnValue(Promise.resolve([]))
      vi.mocked(getStationWalletAddress).mockReturnValue(
        Promise.resolve('f16m5slrkc6zumruuhdzn557a5sdkbkiellron4qa')
      )
      vi.mocked(getDestinationWalletAddress).mockReturnValue(Promise.resolve(''))
      vi.mocked(getActivities).mockReturnValue(Promise.resolve([]))
      vi.mocked(getScheduledRewards).mockReturnValue(Promise.resolve('0.0'))
    })

    beforeEach(() => {
      vi.mocked(useWallet).mockReturnValue({
        stationAddress: 'f16m5slrkc6zumruuhdzn557a5sdkbkiellron4qa',
        stationAddress0x: '0x000000000000000000000000000000000000dEaD',
        destinationFilAddress: '',
        walletBalance: '0',
        walletTransactions: [],
        editDestinationAddress: (value?: string) => null,
        dismissCurrentTransaction: () => ({}),
        transferAllFundsToDestinationWallet: async () => undefined,
        processingTransaction: undefined
      })

      vi.mocked(useStationActivity).mockReturnValue({
        totalJobs: 0,
        activities: []
      })
      vi.mocked(useStationRewards).mockReturnValue({
        totalRewardsReceived: 1,
        scheduledRewards,
        historicalRewards: []
      })

      renderApp(<Dashboard />)
    })

    test('display jobs counter', () => {
      waitFor(() => { expect(document.getElementsByClassName('total-jobs')[0].textContent).toBe('0') })
    })

    test('displays earnings counter null', () => {
      waitFor(() => { expect(document.getElementsByClassName('total-earnings')[0].textContent).toBe('--') })
    })

    test('displays empty activty log', () => {
      expect(document.getElementsByClassName('activity-item').length).toBe(0)
    })
  })

  describe('Populated', () => {
    const onActivityLogged = vi.fn((callback) => {
      const value = [{
        id: 'bb9d9a61-75e0-478d-9dd8-aa74756c39c2',
        timestamp: 166386083297,
        source: 'Saturn',
        type: 'info',
        message: 'Saturn node exited with code: 2'
      },
      {
        id: 'bb9d9a61-75e0-478d-9dd8-aa74756c39f7',
        timestamp: 166386083497,
        source: 'Saturn',
        type: 'info',
        message: 'Some random message for testing'
      }]
      setTimeout(() => act(() => callback(value)))
      return () => ({})
    })

    const onScheduledRewardsUpdate = vi.fn((callback) => {
      const value = 200
      setTimeout(() => { act(() => callback(value)) })
      return () => ({})
    })

    const onJobProcessed = vi.fn((callback) => {
      const value = 200
      setTimeout(() => { act(() => callback(value)) })
      return () => ({})
    })

    beforeEach(() => {
      vi.mocked(useWallet).mockReturnValue({
        stationAddress: 'f16m5slrkc6zumruuhdzn557a5sdkbkiellron4qa',
        stationAddress0x: '0x000000000000000000000000000000000000dEaD',
        destinationFilAddress: 'f16m5slrkc6zumruuhdzn557a5sdkbkiellfff2rg',
        walletBalance: '0',
        walletTransactions: [],
        editDestinationAddress: () => null,
        dismissCurrentTransaction: () => ({}),
        transferAllFundsToDestinationWallet: async () => undefined,
        processingTransaction: undefined
      })

      vi.mocked(useStationRewards).mockReturnValue({
        totalRewardsReceived: 1,
        scheduledRewards,
        historicalRewards: []
      })

      vi.mocked(useStationActivity).mockReturnValue({
        totalJobs,
        activities
      })

      renderApp(<Dashboard />)
    })

    test('subscribes and listens the activity logger', () => {
      onActivityLogged(addToActivities)
      waitFor(() => {
        expect(onActivityLogged).toBeCalledTimes(1)
      }, { timeout: 10 })
      waitFor(() => { expect(document.getElementsByClassName('activity-item').length).toBe(2) }, { timeout: 3000 })
    })

    test('subscribes and listens the jobs counter', () => {
      onJobProcessed(setTotalJobs)
      waitFor(() => { expect(onJobProcessed).toBeCalledTimes(1) }, { timeout: 10 })
      waitFor(() => { expect((screen.getByTitle('total jobs')).textContent).toBe('200') }, { timeout: 1000 })
    })

    test('subscribes and listens the earnings counter', () => {
      onScheduledRewardsUpdate(setScheduledRewards)
      waitFor(() => { expect(onScheduledRewardsUpdate).toBeCalledTimes(1) }, { timeout: 10 })
      waitFor(
        () => { expect((screen.getByTitle('scheduled rewards')).textContent).toBe('200FIL') },
        { timeout: 1000 }
      )
    })
  })
})
