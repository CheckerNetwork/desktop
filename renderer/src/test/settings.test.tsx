import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { checkForUpdates, exportSeedPhrase, isOpenAtLogin, saveSubnetLogsAs } from 'src/lib/checker-config'
import Settings from 'src/pages/settings/Settings'
import { describe, expect, test, vi } from 'vitest'

vi.mock('src/lib/checker-config')

const mocks = vi.hoisted(() => {
  return {
    checkForUpdates: vi.fn(),
    exportSeedPhrase: vi.fn(),
    saveSubnetLogsAs: vi.fn()
  }
})

describe('Settings page', () => {
  describe('Interact with start at login setting', () => {
    test('shows openAtLogin initial state as unchecked when disabled', async () => {
      vi.mocked(isOpenAtLogin).mockReturnValue(Promise.resolve(false))
      render(<Settings />)
      expect(await screen.findByLabelText('No')).not.toBeChecked()
    })

    test('shows openAtLogin initial state as checked when enabled', async () => {
      vi.mocked(isOpenAtLogin).mockReturnValue(Promise.resolve(true))
      render(<Settings />)

      expect(await screen.findByLabelText('Yes')).toBeChecked()
    })
  })

  describe('Interact with buttons', () => {
    beforeAll(() => {
      vi.mocked(checkForUpdates).mockImplementation(mocks.checkForUpdates)
      vi.mocked(exportSeedPhrase).mockImplementation(mocks.exportSeedPhrase)
      vi.mocked(saveSubnetLogsAs).mockImplementation(mocks.saveSubnetLogsAs)

      render(<Settings />)
    })

    test('save subnet logs as', async () => {
      await waitFor(() => {
        act(() => fireEvent.click(screen.getByText('Save subnet logs as...')))
        act(() => fireEvent.click(screen.getByText('Check for updates')))
        act(() => fireEvent.click(screen.getByText('Export seed phrase')))
      })

      await waitFor(() => {
        expect(mocks.saveSubnetLogsAs).toHaveBeenCalledOnce()
        expect(mocks.checkForUpdates).toHaveBeenCalledOnce()
        expect(mocks.exportSeedPhrase).toHaveBeenCalledOnce()
      })
    })
  })
})
