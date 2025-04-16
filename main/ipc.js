'use strict'

const { ipcMain } = require('electron')

const checkerConfig = require('./checker-config')
const wallet = require('./wallet')

/** @typedef {import('./typings').Context} Context */

const ipcMainEvents = Object.freeze({
  ACTIVITY_LOGGED: 'checker:activity-logged',
  JOB_STATS_UPDATED: 'checker:job-stats-updated',

  UPDATE_CHECK_STARTED: 'checker:update-check:started',
  UPDATE_CHECK_FINISHED: 'checker:update-check:finished',
  READY_TO_UPDATE: 'checker:ready-to-update',

  TRANSACTION_UPDATE: 'checker:transaction-update',
  BALANCE_UPDATE: 'checker:wallet-balance-update',
  SCHEDULED_REWARDS_UPDATE: 'checker:scheduled-rewards-update'
})

function setupIpcMain (/** @type {Context} */ ctx) {
  // Checker-wide config
  ipcMain.handle(
    'checker:getOnboardingCompleted',
    checkerConfig.getOnboardingCompleted
  )
  ipcMain.handle(
    'checker:setOnboardingCompleted',
    (_event) => checkerConfig.setOnboardingCompleted()
  )
  // Wallet-wide config
  ipcMain.handle('checker:getCheckerWalletAddress', wallet.getAddress)
  ipcMain.handle(
    'checker:getDestinationWalletAddress',
    checkerConfig.getDestinationWalletAddress
  )
  ipcMain.handle(
    'checker:setDestinationWalletAddress',
    (_event, address) => checkerConfig.setDestinationWalletAddress(address)
  )
  ipcMain.handle('checker:getCheckerWalletBalance', wallet.getBalance)
  ipcMain.handle(
    'checker:getScheduledRewards',
    ctx.getScheduledRewardsForAddress
  )
  ipcMain.handle(
    'checker:getCheckerWalletTransactionsHistory',
    wallet.listTransactions
  )
  ipcMain.handle(
    'checker:transferAllFundsToDestinationWallet',
    (_event, _args) => wallet.transferAllFundsToDestinationWallet())
  ipcMain.handle(
    'checker:getActivities',
    (_event, _args) => ctx.getActivities())
  ipcMain.handle(
    'checker:getTotalJobsCompleted',
    (_event, _args) => ctx.getTotalJobsCompleted())

  ipcMain.handle(
    'checker:restartToUpdate',
    (_event, _args) => ctx.restartToUpdate()
  )
  ipcMain.handle(
    'checker:openReleaseNotes',
    (_event) => ctx.openReleaseNotes()
  )
  ipcMain.handle(
    'checker:getUpdaterStatus',
    (_events, _args) => ctx.getUpdaterStatus()
  )
  ipcMain.handle(
    'checker:openExternalURL',
    (_events, url) => ctx.openExternalURL(url)
  )
  ipcMain.handle(
    'checker:toggleOpenAtLogin',
    (_events) => ctx.toggleOpenAtLogin()
  )
  ipcMain.handle(
    'checker:isOpenAtLogin',
    (_events) => ctx.isOpenAtLogin()
  )
  ipcMain.handle(
    'checker:exportSeedPhrase',
    (_events) => ctx.exportSeedPhrase()
  )
  ipcMain.handle(
    'checker:saveSubnetLogsAs',
    (_events) => ctx.saveSubnetLogsAs()
  )
  ipcMain.handle(
    'checker:checkForUpdates',
    (_events) => ctx.manualCheckForUpdates()
  )
}

module.exports = {
  setupIpcMain,
  ipcMainEvents
}
