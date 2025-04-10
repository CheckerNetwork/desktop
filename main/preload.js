'use strict'

/** @typedef {import('electron').IpcRendererEvent} IpcRendererEvent */
/** @typedef {import('./typings').Activity} Activity */
/** @typedef {import('./typings').FILTransaction} FILTransaction */
/** @typedef {
  import('./typings').FILTransactionProcessing
} FILTransactionProcessing */

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  stationBuildVersion: process.env.STATION_BUILD_VERSION,

  getActivities: () => ipcRenderer.invoke('station:getActivities'),
  getTotalJobsCompleted: () =>
    ipcRenderer.invoke('station:getTotalJobsCompleted'),
  getUpdaterStatus: () => ipcRenderer.invoke('station:getUpdaterStatus'),
  restartToUpdate: () => ipcRenderer.invoke('station:restartToUpdate'),
  openReleaseNotes: () => ipcRenderer.invoke('station:openReleaseNotes'),

  getScheduledRewards: () =>
    ipcRenderer.invoke('station:getScheduledRewards'),

  stationConfig: {
    getOnboardingCompleted: () =>
      ipcRenderer.invoke('station:getOnboardingCompleted'),
    setOnboardingCompleted: () =>
      ipcRenderer.invoke('station:setOnboardingCompleted'),
    getStationWalletAddress: () =>
      ipcRenderer.invoke('station:getStationWalletAddress'),
    getDestinationWalletAddress: () =>
      ipcRenderer.invoke('station:getDestinationWalletAddress'),
    setDestinationWalletAddress: (/** @type {string | undefined} */ address) =>
      ipcRenderer.invoke('station:setDestinationWalletAddress', address),
    getStationWalletBalance: () =>
      ipcRenderer.invoke('station:getStationWalletBalance'),
    getStationWalletTransactionsHistory: () =>
      ipcRenderer.invoke('station:getStationWalletTransactionsHistory'),
    transferAllFundsToDestinationWallet: () =>
      ipcRenderer.invoke('station:transferAllFundsToDestinationWallet'),
    openExternalURL: (/** @type {string } */ url) =>
      ipcRenderer.invoke('station:openExternalURL', url),
    getScheduledRewards: () =>
      ipcRenderer.invoke('station:getScheduledRewards'),
    toggleOpenAtLogin: () =>
      ipcRenderer.invoke('station:toggleOpenAtLogin'),
    isOpenAtLogin: () => ipcRenderer.invoke('station:isOpenAtLogin'),
    exportSeedPhrase: () => ipcRenderer.invoke('station:exportSeedPhrase'),
    importSeedPhrase: () => ipcRenderer.invoke('station:importSeedPhrase'),
    saveModuleLogsAs: () => ipcRenderer.invoke('station:saveModuleLogsAs'),
    checkForUpdates: () => ipcRenderer.invoke('station:checkForUpdates')
  },
  stationEvents: {
    onActivityLogged: (/** @type {(value: Activity) => void} */ callback) => {
      /** @type {(event: IpcRendererEvent, ...args: any[]) => void} */
      const listener = (_event, activities) => callback(activities)
      ipcRenderer.on('station:activity-logged', listener)
      return () =>
        ipcRenderer.removeListener('station:activity-logged', listener)
    },
    onJobProcessed: (/** @type {(value: number) => void} */ callback) => {
      /** @type {(event: IpcRendererEvent, ...args: any[]) => void} */
      const listener = (_event, totalJobCount) => callback(totalJobCount)
      ipcRenderer.on('station:job-stats-updated', listener)
      return () =>
        ipcRenderer.removeListener('station:job-stats-updated', listener)
    },
    onEarningsChanged: (/** @type {(value: number) => void} */ callback) => {
      /** @type {(event: IpcRendererEvent, ...args: any[]) => void} */
      const listener = (_event, totalEarnings) => callback(totalEarnings)
      ipcRenderer.on('station:earnings-counter', listener)
      return () =>
        ipcRenderer.removeListener('station:earnings-counter', listener)
    },
    onReadyToUpdate: (/** @type {() => void} */ callback) => {
      const listener = () => callback()
      ipcRenderer.on('station:ready-to-update', listener)
      return () =>
        ipcRenderer.removeListener('station:ready-to-update', listener)
    },
    onBalanceUpdate: (/** @type {(value: string) => void} */ callback) => {
      /** @type {(event: IpcRendererEvent, ...args: any[]) => void} */
      const listener = (_event, balance) => callback(balance)
      ipcRenderer.on('station:wallet-balance-update', listener)
      return () =>
        ipcRenderer.removeListener('station:wallet-balance-update', listener)
    },
    onTransactionUpdate: (
      /** @type {
        (value: (FILTransaction|FILTransactionProcessing)[]) => void
      } */
      callback
    ) => {
      /** @type {(event: IpcRendererEvent, ...args: any[]) => void} */
      const listener = (_event, transactions) => callback(transactions)
      ipcRenderer.on('station:transaction-update', listener)
      return () =>
        ipcRenderer.removeListener('station:transaction-update', listener)
    },

    onScheduledRewardsUpdate: (
    /** @type {(value: string) => void} */ callback
    ) => {
    /** @type {(event: IpcRendererEvent, ...args: any[]) => void} */
      const listener = (_event, balance) => callback(balance)
      ipcRenderer.on('station:scheduled-rewards-update', listener)
      return () =>
        ipcRenderer.removeListener('station:scheduled-rewards-update', listener)
    }
  }
})
