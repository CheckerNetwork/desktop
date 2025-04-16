'use strict'

/** @typedef {import('electron').IpcRendererEvent} IpcRendererEvent */
/** @typedef {import('./typings').Activity} Activity */
/** @typedef {import('./typings').FILTransaction} FILTransaction */
/** @typedef {
  import('./typings').FILTransactionProcessing
} FILTransactionProcessing */

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  checkerBuildVersion: process.env.CHECKER_BUILD_VERSION,

  getActivities: () => ipcRenderer.invoke('checker:getActivities'),
  getTotalJobsCompleted: () =>
    ipcRenderer.invoke('checker:getTotalJobsCompleted'),
  getUpdaterStatus: () => ipcRenderer.invoke('checker:getUpdaterStatus'),
  restartToUpdate: () => ipcRenderer.invoke('checker:restartToUpdate'),
  openReleaseNotes: () => ipcRenderer.invoke('checker:openReleaseNotes'),

  getScheduledRewards: () =>
    ipcRenderer.invoke('checker:getScheduledRewards'),

  checkerConfig: {
    getOnboardingCompleted: () =>
      ipcRenderer.invoke('checker:getOnboardingCompleted'),
    setOnboardingCompleted: () =>
      ipcRenderer.invoke('checker:setOnboardingCompleted'),
    getCheckerWalletAddress: () =>
      ipcRenderer.invoke('checker:getCheckerWalletAddress'),
    getDestinationWalletAddress: () =>
      ipcRenderer.invoke('checker:getDestinationWalletAddress'),
    setDestinationWalletAddress: (/** @type {string | undefined} */ address) =>
      ipcRenderer.invoke('checker:setDestinationWalletAddress', address),
    getCheckerWalletBalance: () =>
      ipcRenderer.invoke('checker:getCheckerWalletBalance'),
    getCheckerWalletTransactionsHistory: () =>
      ipcRenderer.invoke('checker:getCheckerWalletTransactionsHistory'),
    transferAllFundsToDestinationWallet: () =>
      ipcRenderer.invoke('checker:transferAllFundsToDestinationWallet'),
    openExternalURL: (/** @type {string } */ url) =>
      ipcRenderer.invoke('checker:openExternalURL', url),
    getScheduledRewards: () =>
      ipcRenderer.invoke('checker:getScheduledRewards'),
    toggleOpenAtLogin: () =>
      ipcRenderer.invoke('checker:toggleOpenAtLogin'),
    isOpenAtLogin: () => ipcRenderer.invoke('checker:isOpenAtLogin'),
    exportSeedPhrase: () => ipcRenderer.invoke('checker:exportSeedPhrase'),
    saveSubnetLogsAs: () => ipcRenderer.invoke('checker:saveSubnetLogsAs'),
    checkForUpdates: () => ipcRenderer.invoke('checker:checkForUpdates')
  },
  checkerEvents: {
    onActivityLogged: (/** @type {(value: Activity) => void} */ callback) => {
      /** @type {(event: IpcRendererEvent, ...args: any[]) => void} */
      const listener = (_event, activities) => callback(activities)
      ipcRenderer.on('checker:activity-logged', listener)
      return () =>
        ipcRenderer.removeListener('checker:activity-logged', listener)
    },
    onJobProcessed: (/** @type {(value: number) => void} */ callback) => {
      /** @type {(event: IpcRendererEvent, ...args: any[]) => void} */
      const listener = (_event, totalJobCount) => callback(totalJobCount)
      ipcRenderer.on('checker:job-stats-updated', listener)
      return () =>
        ipcRenderer.removeListener('checker:job-stats-updated', listener)
    },
    onEarningsChanged: (/** @type {(value: number) => void} */ callback) => {
      /** @type {(event: IpcRendererEvent, ...args: any[]) => void} */
      const listener = (_event, totalEarnings) => callback(totalEarnings)
      ipcRenderer.on('checker:earnings-counter', listener)
      return () =>
        ipcRenderer.removeListener('checker:earnings-counter', listener)
    },
    onReadyToUpdate: (/** @type {() => void} */ callback) => {
      const listener = () => callback()
      ipcRenderer.on('checker:ready-to-update', listener)
      return () =>
        ipcRenderer.removeListener('checker:ready-to-update', listener)
    },
    onBalanceUpdate: (/** @type {(value: string) => void} */ callback) => {
      /** @type {(event: IpcRendererEvent, ...args: any[]) => void} */
      const listener = (_event, balance) => callback(balance)
      ipcRenderer.on('checker:wallet-balance-update', listener)
      return () =>
        ipcRenderer.removeListener('checker:wallet-balance-update', listener)
    },
    onTransactionUpdate: (
      /** @type {
        (value: (FILTransaction|FILTransactionProcessing)[]) => void
      } */
      callback
    ) => {
      /** @type {(event: IpcRendererEvent, ...args: any[]) => void} */
      const listener = (_event, transactions) => callback(transactions)
      ipcRenderer.on('checker:transaction-update', listener)
      return () =>
        ipcRenderer.removeListener('checker:transaction-update', listener)
    },

    onScheduledRewardsUpdate: (
    /** @type {(value: string) => void} */ callback
    ) => {
    /** @type {(event: IpcRendererEvent, ...args: any[]) => void} */
      const listener = (_event, balance) => callback(balance)
      ipcRenderer.on('checker:scheduled-rewards-update', listener)
      return () =>
        ipcRenderer.removeListener('checker:scheduled-rewards-update', listener)
    }
  }
})
