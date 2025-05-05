import { TooltipProvider } from '@radix-ui/react-tooltip'
import { render } from '@testing-library/react'
import { ReactNode } from 'react'
import { BrowserRouter } from 'react-router'
import { DialogProvider } from 'src/components/DialogProvider'
import Layout from 'src/components/Layout'
import { vi } from 'vitest'

export function stubGlobalElectron () {
  vi.stubGlobal('electron', {
    checkerEvents: {
      onActivityLogged: vi.fn(),
      onEarningsChanged: vi.fn(),
      onJobProcessed: vi.fn(),
      onReadyToUpdate: vi.fn(),
      onTransactionUpdate: vi.fn(),
      onBalanceUpdate: vi.fn(),
      onScheduledRewardsUpdate: vi.fn()
    },
    getUpdaterStatus: vi.fn(async () => ({ readyToUpdate: false }))
  })
}

export function renderApp (children: ReactNode) {
  render((
    <BrowserRouter>
      <TooltipProvider>
        <DialogProvider>
          <Layout>
            {children}
          </Layout>
        </DialogProvider>
      </TooltipProvider>
    </BrowserRouter>
  ))
}
