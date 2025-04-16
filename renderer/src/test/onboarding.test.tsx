import { beforeEach, describe, expect, test, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import { getOnboardingCompleted, setOnboardingCompleted, showTermsOfService } from 'src/lib/checker-config'
import Onboarding from 'src/pages/onboarding/Onboarding'
import { BrowserRouter } from 'react-router'

const mocks = vi.hoisted(() => {
  return {
    useNavigate: vi.fn()
  }
})

vi.mock('src/lib/checker-config')
vi.mock('react-router', async () => {
  const router = await vi.importActual('react-router')

  return {
    ...router,
    useNavigate: () => mocks.useNavigate
  }
})

describe('Welcome page test', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('User has completed the onboarding previously', () => {
    beforeAll(() => {
      vi.mocked(setOnboardingCompleted).mockReturnValue(Promise.resolve(undefined))
      vi.mocked(getOnboardingCompleted).mockReturnValue(Promise.resolve(true))
      vi.mocked(showTermsOfService).mockReturnValue(undefined)
    })

    beforeEach(() => {
      render(<BrowserRouter><Onboarding /></BrowserRouter >)
    })

    test('Redirects to dashboard directly if user is onboarded', async () => {
      await waitFor(() => expect(mocks.useNavigate).toHaveBeenCalledTimes(1), { timeout: 3000 })
      await waitFor(
        () => expect(mocks.useNavigate).toHaveBeenCalledWith('/dashboard', { replace: true }),
        { timeout: 3000 }
      )
    })
  })

  describe('User has not completed the onboarding', () => {
    beforeAll(() => {
      vi.mocked(setOnboardingCompleted).mockReturnValue(Promise.resolve(undefined))
      vi.mocked(getOnboardingCompleted).mockReturnValue(Promise.resolve(false))
      vi.mocked(showTermsOfService).mockReturnValue(undefined)
    })

    beforeEach(() => {
      render(<BrowserRouter> <Onboarding /></BrowserRouter >)
    })

    test('loads and show onboarding modal on startup', async () => {
      await waitFor(
        () => { expect(document.getElementsByClassName('onboarding')).toHaveLength(1) },
        { timeout: 3000 }
      )
    })

    test('interact with onboarding slides', async () => {
      await waitFor(
        () => { expect(screen.getByText(/Back/i).closest('button')).toBeDisabled() },
        { timeout: 3000 }
      )
      await waitFor(() => expect(document.getElementsByClassName('onboarding-0')).toHaveLength(1))
      act(() => { fireEvent.click(screen.getByText(/Continue/i)) })
      await waitFor(() => expect(document.getElementsByClassName('onboarding-1')).toHaveLength(1))
      act(() => { fireEvent.click(screen.getByText(/Continue/i)) })
      await waitFor(() => expect(document.getElementsByClassName('onboarding-2')).toHaveLength(1))
      act(() => { fireEvent.click(screen.getByText(/Back/i)) })
      await waitFor(() => expect(document.getElementsByClassName('onboarding-1')).toHaveLength(1))
      act(() => { fireEvent.click(screen.getByText(/Back/i)) })
      await waitFor(() => expect(document.getElementsByClassName('onboarding-0')).toHaveLength(1))
    })

    test('redirects to dashboard on accept', async () => {
      await waitFor(
        () => expect(document.getElementsByClassName('onboarding-0')).toHaveLength(1),
        { timeout: 3000 }
      )
      await waitFor(() => act(() => { fireEvent.click(screen.getByText(/Continue/i)) }))
      await waitFor(() => act(() => { fireEvent.click(screen.getByText(/Continue/i)) }))
      await waitFor(() => act(() => { fireEvent.click(screen.getByTitle(/Accept/i)) }))
      await waitFor(() => expect(mocks.useNavigate).toHaveBeenCalledWith('/dashboard', { replace: true }))
    })
  })
})
