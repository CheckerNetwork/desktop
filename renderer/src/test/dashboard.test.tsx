import { beforeEach, describe, expect, test, vi } from 'vitest'
import { screen, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  getActivities,
  getDestinationWalletAddress,
  getScheduledRewards,
  getCheckerWalletAddress,
  getCheckerWalletBalance,
  getCheckerWalletTransactionsHistory
} from 'src/lib/checker-config'
import Dashboard from 'src/pages/dashboard/Dashboard'
import useWallet from 'src/hooks/CheckerWallet'
import useCheckerActivity from 'src/hooks/CheckerActivity'
import { Activity } from '../../../shared/typings'
import useCheckerRewards from 'src/hooks/CheckerRewards'
import { stubGlobalElectron, renderApp } from './helpers'
import { useEffect, useState } from 'react'

vi.mock('src/hooks/CheckerWallet')
vi.mock('src/hooks/CheckerActivity')
vi.mock('src/hooks/CheckerRewards')
vi.mock('src/lib/checker-config')

stubGlobalElectron()

describe('Dashboard page', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('Unpopulated', () => {
    beforeAll(() => {
      vi.mocked(getCheckerWalletBalance).mockReturnValue(Promise.resolve('0'))
      vi.mocked(getCheckerWalletTransactionsHistory).mockReturnValue(Promise.resolve([]))
      vi.mocked(getCheckerWalletAddress).mockReturnValue(
        Promise.resolve('f16m5slrkc6zumruuhdzn557a5sdkbkiellron4qa')
      )
      vi.mocked(getDestinationWalletAddress).mockReturnValue(Promise.resolve(''))
      vi.mocked(getActivities).mockReturnValue(Promise.resolve([]))
      vi.mocked(getScheduledRewards).mockReturnValue(Promise.resolve('0.0'))
    })

    beforeEach(() => {
      vi.mocked(useWallet).mockReturnValue({
        checkerAddress: 'f16m5slrkc6zumruuhdzn557a5sdkbkiellron4qa',
        checkerAddress0x: '0x000000000000000000000000000000000000dEaD',
        destinationFilAddress: '',
        walletBalance: '0',
        walletTransactions: [],
        editDestinationAddress: (value?: string) => null,
        dismissCurrentTransaction: () => ({}),
        transferAllFundsToDestinationWallet: async () => undefined,
        processingTransaction: undefined
      })

      vi.mocked(useCheckerActivity).mockReturnValue({
        totalJobs: 0,
        activities: []
      })
      vi.mocked(useCheckerRewards).mockReturnValue({
        totalRewardsReceived: BigInt(1e18),
        scheduledRewards: BigInt(100 * 1e18),
        historicalRewards: []
      })

      renderApp(<Dashboard />)
    })

    test('display jobs counter', () => {
      expect(screen.getByTestId('jobs-counter').textContent).toBe('0')
    })

    test('displays earnings counter null', () => {
      expect(screen.getByTestId('earnings-counter').textContent).toBe('1.000000 FIL')
    })

    test('displays empty activity log', () => {
      expect(screen.queryAllByTestId('activity-item').length).toBe(0)
    })
  })

  describe('Populated', () => {
    beforeEach(() => {
      vi.useFakeTimers()

      vi.mocked(useWallet).mockReturnValue({
        checkerAddress: 'f16m5slrkc6zumruuhdzn557a5sdkbkiellron4qa',
        checkerAddress0x: '0x000000000000000000000000000000000000dEaD',
        destinationFilAddress: 'f16m5slrkc6zumruuhdzn557a5sdkbkiellfff2rg',
        walletBalance: '0',
        walletTransactions: [],
        editDestinationAddress: () => null,
        dismissCurrentTransaction: () => ({}),
        transferAllFundsToDestinationWallet: async () => undefined,
        processingTransaction: undefined
      })

      vi.mocked(useCheckerRewards).mockImplementation(() => {
        const [mockedRewards, setMockedRewards] = useState(0n)

        useEffect(() => {
          setTimeout(() => {
            setMockedRewards(BigInt(10 * 1e18))
          }, 100)
        }, [])

        return {
          totalRewardsReceived: mockedRewards,
          scheduledRewards: BigInt(100 * 1e18),
          historicalRewards: []
        }
      })

      vi.mocked(useCheckerActivity).mockImplementation(() => {
        const [mockedActivities, setMockedActivities] = useState<Activity[]>([])
        const [mockedJobs, setMockedJobs] = useState(100)

        useEffect(() => {
          setTimeout(() => {
            setMockedJobs(200)
            setMockedActivities([
              {
                id: 'bb9d9a61-75e0-478d-9dd8-aa74756c39c2',
                timestamp: new Date(166386083297),
                source: 'Saturn',
                type: 'info',
                message: 'Saturn node exited with code: 2'
              },
              {
                id: 'bb9d9a61-75e0-478d-9dd8-aa74756c39f7',
                timestamp: new Date(166386083497),
                source: 'Saturn',
                type: 'info',
                message: 'Some random message for testing'
              }
            ])
          }, 100)
        }, [])

        return {
          totalJobs: mockedJobs,
          activities: mockedActivities
        }
      })

      renderApp(<Dashboard />)
    })

    afterEach(() => {
      vi.clearAllTimers()
      vi.useRealTimers()
    })

    test('subscribes and listens the activity logger', async () => {
      expect(screen.queryAllByTestId('activity-item').length).toBe(0)

      act(() => {
        vi.runAllTimers()
      })

      vi.clearAllTimers()
      vi.useRealTimers()

      await waitFor(() => {
        expect(screen.queryAllByTestId('activity-item').length).toBe(2)
      })
    })

    test('subscribes and listens the jobs counter', async () => {
      expect(screen.getByTestId('jobs-counter').textContent).toBe('100')

      act(() => {
        vi.runAllTimers()
      })

      vi.clearAllTimers()
      vi.useRealTimers()

      await waitFor(() => {
        expect(screen.getByTestId('jobs-counter').textContent).toBe('200')
      })
    })

    test('subscribes and listens the earnings counter', async () => {
      expect(screen.getByTestId('earnings-counter').textContent).toBe('0.000000 FIL')

      act(() => {
        vi.runAllTimers()
      })

      vi.clearAllTimers()
      vi.useRealTimers()

      await waitFor(() => {
        expect(screen.getByTestId('earnings-counter').textContent).toBe('10.000000 FIL')
      })
    })
  })
})
