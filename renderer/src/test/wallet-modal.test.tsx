import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, act, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import 'src/lib/checker-config'
import Dashboard from 'src/pages/dashboard/Dashboard'
import useCheckerActivity from 'src/hooks/CheckerActivity'
import useWallet from 'src/hooks/CheckerWallet'
import useCheckerRewards from 'src/hooks/CheckerRewards'
import { renderApp, stubGlobalElectron } from './helpers'

const mockedSetDestinationWalletAddress = vi.fn()

vi.mock('src/lib/checker-config', () => ({
  getCheckerWalletBalance: () => Promise.resolve(0),
  getCheckerWalletTransactionsHistory: () => Promise.resolve([]),
  getCheckerWalletAddress: () => Promise.resolve('f16m5slrkc6zumruuhdzn557a5sdkbkiellron4qa'),
  getDestinationWalletAddress: () => Promise.resolve(''),
  setDestinationWalletAddress: () => mockedSetDestinationWalletAddress,
  getScheduledRewards: () => Promise.resolve('0.0'),
  getActivities: () => Promise.resolve([]),
  openBeryx: () => Promise.resolve()
}))
vi.mock('src/hooks/CheckerWallet')
vi.mock('src/hooks/CheckerActivity')
vi.mock('src/hooks/CheckerRewards')

stubGlobalElectron()

describe('Dashboard wallet display', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useWallet).mockReturnValue({
      checkerAddress: 'f16m5slrkc6zumruuhdzn557a5sdkbkiellron4qa',
      checkerAddress0x: '0x000000000000000000000000000000000000dEaD',
      destinationFilAddress: '',
      walletBalance: '0',
      walletTransactions: [],
      editDestinationAddress: (value?: string) => null,
      processingTransaction: undefined,
      dismissCurrentTransaction: () => ({}),
      transferAllFundsToDestinationWallet: async () => undefined
    })

    vi.mocked(useCheckerActivity).mockReturnValue({
      totalJobs: 0,
      activities: []
    })
    vi.mocked(useCheckerRewards).mockReturnValue({
      totalRewardsReceived: BigInt(1e18),
      scheduledRewards: undefined,
      historicalRewards: []
    })

    renderApp(<Dashboard />)
  })

  test('Clicking wallet widget opens modal', async () => {
    expect(screen.getByTestId('wallet-widget')).toBeInTheDocument()

    act(() => { fireEvent.click(screen.getByTestId('wallet-widget')) })
    expect(screen.getByRole('dialog')).toBeVisible()
  })

  test('Wallet displays internal address', () => {
    expect(screen.getByTestId('wallet-widget')).toBeInTheDocument()

    act(() => { fireEvent.click(screen.getByTestId('wallet-widget')) })

    expect(screen.getByText('f16m5s...ron4qa')).toBeVisible()
  })

  test('Wallet displays correct balance', () => {
    expect(screen.getByTestId('wallet-widget')).toBeInTheDocument()

    act(() => { fireEvent.click(screen.getByTestId('wallet-widget')) })

    expect(screen.getAllByText(/0 FIL/)[0]).toBeInTheDocument()
  })
})
