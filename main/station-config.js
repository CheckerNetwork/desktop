'use strict'

const Store = require('electron-store')
const { randomUUID } = require('crypto')

const ConfigKeys = {
  OnboardingCompleted: 'station.OnboardingCompleted',
  TrayOperationExplained: 'station.TrayOperationExplained',
  StationID: 'station.StationID',
  FilAddress: 'station.FilAddress',
  DestinationFilAddress: 'station.FilAddress' // todo - replace by 'station.DestinationFilAddress'
}

/** @typedef {import('./typings').FILTransaction} TransactionMessage */

// Use this to test migrations
// https://github.com/sindresorhus/electron-store/issues/205
// require('electron').app.setVersion('9999.9.9')

const configStore = new Store({
  migrations: {
    '>=0.9.0': store => {
      if (store.has('station.onboardingCompleted')) {
        store.set(ConfigKeys.OnboardingCompleted, store.get('station.onboardingCompleted'))
      }
      if (store.has('saturn.filAddress')) {
        store.set(ConfigKeys.FilAddress, store.get('saturn.filAddress'))
      }
    }
  },
  beforeEachMigration: (_, context) => {
    console.log(`Migrating station-config from ${context.fromVersion} → ${context.toVersion}`)
  }
})

console.log('Loading Station configuration from', configStore.path)

let OnboardingCompleted = /** @type {boolean} */ (configStore.get(ConfigKeys.OnboardingCompleted, false))
let TrayOperationExplained = /** @type {boolean} */ (configStore.get(ConfigKeys.TrayOperationExplained, false))
let FilAddress = /** @type {string | undefined} */ (configStore.get(ConfigKeys.FilAddress))
let DestinationFilAddress = /** @type {string | undefined} */ (configStore.get(ConfigKeys.DestinationFilAddress))
const StationID = /** @type {string} */ (configStore.get(ConfigKeys.StationID, randomUUID()))

/**
 * @returns {boolean}
 */
function getOnboardingCompleted () {
  return !!OnboardingCompleted
}

/**
 *
 */
function setOnboardingCompleted () {
  OnboardingCompleted = true
  configStore.set(ConfigKeys.OnboardingCompleted, OnboardingCompleted)
}

/**
 * @returns {boolean}
 */
function getTrayOperationExplained () {
  return !!TrayOperationExplained
}

/**
 *
 */
function setTrayOperationExplained () {
  TrayOperationExplained = true
  configStore.set(ConfigKeys.TrayOperationExplained, TrayOperationExplained)
}

/**
 * @returns {string | undefined}
 */
function getFilAddress () {
  return FilAddress
}

/**
 * @returns {string}
 */
function getStationID() {
  return StationID
}

/**
 * @returns {string}
 */
function getStationWalletAddress() {
  return FilAddress || '' // needs refactor
}

/**
 * @returns {string | undefined}
 */
function getDestinationWalletAddress() {
  return DestinationFilAddress
}

/**
 * @param {string | undefined} address
 */
function setDestinationWalletAddress(address) {
  DestinationFilAddress = address
  configStore.set(ConfigKeys.DestinationFilAddress, DestinationFilAddress)
}

/**
 * @returns {number}
 */
function getStationWalletBalance() {
  return 0 // todo - backend logic
}

/**
 * @returns { TransactionMessage[] }
 */
function getStationWalletTransactionsHistory() {
  return [] // todo - backend logic
}

/**
 * @returns void
 */
function trasnferAllFundsToDestinationWallet() {
  return {} // todo - backend logic
}

module.exports = {
  getOnboardingCompleted,
  setOnboardingCompleted,
  getTrayOperationExplained,
  setTrayOperationExplained,
  getFilAddress,
  getStationID,
  getStationWalletAddress,
  getDestinationWalletAddress,
  setDestinationWalletAddress,
  getStationWalletBalance,
  getStationWalletTransactionsHistory,
  trasnferAllFundsToDestinationWallet
}
