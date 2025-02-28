import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import useWallet from 'src/hooks/CheckerWallet'
import { truncateString } from 'src/lib/utils'
import { describe, expect, test, vi } from 'vitest'
import { renderApp, stubGlobalElectron } from './helpers'
import Wallet from 'src/pages/wallet/Wallet'
import { useEffect, useState } from 'react'

vi.mock('src/hooks/CheckerWallet')
vi.mock('src/pages/wallet/GridCanvas')

const mockTransfer = vi.fn()

stubGlobalElectron()

describe('Transfer page', () => {
  describe('Wallet info', () => {
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

      renderApp(<Wallet />)
    })

    test('Displays wallet info', () => {
      expect(screen.getByText(truncateString('f16m5slrkc6zumruuhdzn557a5sdkbkiellron4qa'))).toBeInTheDocument()
      expect(screen.getByText(truncateString('0x000000000000000000000000000000000000dEaD'))).toBeInTheDocument()
    })
  })

  describe('Fill in destination address', () => {
    beforeEach(() => {
      vi.mocked(useWallet).mockImplementation(() => {
        const [destinationFilAddress, setDestinationFilAddress] = useState('')

        function editDestinationAddress (value?: string) {
          act(() => setDestinationFilAddress(value || ''))
        }

        return {
          checkerAddress: 'f16m5slrkc6zumruuhdzn557a5sdkbkiellron4qa',
          checkerAddress0x: '0x000000000000000000000000000000000000dEaD',
          destinationFilAddress,
          walletBalance: '0',
          walletTransactions: [],
          editDestinationAddress,
          dismissCurrentTransaction: () => ({}),
          transferAllFundsToDestinationWallet: async () => undefined,
          processingTransaction: undefined
        }
      })

      renderApp(<Wallet />)
    })

    test('If destination address not set, show address form', () => {
      expect(screen.getByTestId('destination-address-form')).toBeInTheDocument()
      expect(screen.queryAllByTestId('balance-control').length).toBe(0)
    })

    test('Filling destination address input shows balance control', async () => {
      const value = '0x000000000000000000000000000000000000dEaD'

      act(() => {
        fireEvent.change(screen.getByTestId('destination-address-form-input'), {
          target: { value }
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId('destination-address-form-input')).toHaveValue(value)
      })

      act(() => {
        fireEvent.submit(screen.getByTestId('destination-address-form'))
      })

      act(() => {
        fireEvent.animationEnd(screen.getByTestId('destination-address-form-wrapper'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('balance-control')).toBeInTheDocument()
      })
    })
  })

  describe('Transfer funds', () => {
    beforeEach(() => {
      vi.useFakeTimers()

      vi.mocked(useWallet).mockImplementation(() => {
        const [balance, setBalance] = useState('0')

        useEffect(() => {
          setTimeout(() => (
            setBalance('2')
          ), 500)
        }, [])

        return {
          checkerAddress: 'f16m5slrkc6zumruuhdzn557a5sdkbkiellron4qa',
          checkerAddress0x: '0x000000000000000000000000000000000000dEaD',
          destinationFilAddress: '0x000000000000000000000000000000000000dEaD',
          walletBalance: balance,
          walletTransactions: [],
          editDestinationAddress: () => null,
          dismissCurrentTransaction: () => ({}),
          transferAllFundsToDestinationWallet: mockTransfer,
          processingTransaction: undefined
        }
      })

      renderApp(<Wallet />)
    })

    afterEach(() => {
      vi.clearAllTimers()
      vi.useRealTimers()
    })

    test('If balance below threshold, disable transfer button. Enable otherwise', async () => {
      expect(screen.getByText('Transfer')).toBeDisabled()

      act(() => {
        vi.runAllTimers()
      })

      vi.clearAllTimers()
      vi.useRealTimers()

      expect(screen.getByText('Transfer')).toBeEnabled()
    })

    test('Clicking transfer shows confirmation step', async () => {
      act(() => {
        vi.runAllTimers()
      })

      vi.clearAllTimers()
      vi.useRealTimers()

      act(() => {
        fireEvent.click(screen.getByText('Transfer'))
      })

      const cancel = await screen.findByText('Cancel')

      expect(cancel).toBeInTheDocument()
    })

    test('Clicking confirm triggers send', async () => {
      act(() => {
        vi.runAllTimers()
      })

      vi.clearAllTimers()
      vi.useRealTimers()

      act(() => {
        fireEvent.click(screen.getByText('Transfer'))
      })

      await screen.findByText('Cancel')

      act(() => {
        fireEvent.click(screen.getAllByText('Transfer')[0])
      })

      expect(mockTransfer).toHaveBeenCalled()
    })
  })
})
