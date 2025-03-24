'use strict'

const Store = require('electron-store')

const log = require('electron-log').scope('config')

const ConfigKeys = {
  OnboardingCompleted: 'station.OnboardingCompleted',
  TrayOperationExplained: 'station.TrayOperationExplained',
  CheckerID: 'station.CheckerID',
  FilAddress: 'station.FilAddress',
  DestinationFilAddress: 'station.DestinationFilAddress'
}

// Use this to test migrations
// https://github.com/sindresorhus/electron-store/issues/205
// require('electron').app.setVersion('9999.9.9')

const configStore = new Store({
  migrations: {
    '>=0.9.0': store => {
      if (store.has('station.onboardingCompleted')) {
        store.set(
          ConfigKeys.OnboardingCompleted,
          store.get('station.onboardingCompleted')
        )
      }
      if (store.has('saturn.filAddress')) {
        store.set(ConfigKeys.FilAddress, store.get('saturn.filAddress'))
      }
    }
  },
  beforeEachMigration: (_, context) => {
    log.info(
      `Migrating station-config from ${context.fromVersion} → ` +
        context.toVersion
    )
  }
})

log.info('Loading Station configuration from', configStore.path)

let OnboardingCompleted =
  /** @type {boolean} */
  (configStore.get(ConfigKeys.OnboardingCompleted, false))
let TrayOperationExplained =
  /** @type {boolean} */
  (configStore.get(ConfigKeys.TrayOperationExplained, false))
let DestinationFilAddress =
  /** @type {string | undefined} */
  (configStore.get(ConfigKeys.DestinationFilAddress))

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
function getDestinationWalletAddress () {
  return DestinationFilAddress
}

/**
 * @param {string | undefined} address
 */
function setDestinationWalletAddress (address) {
  DestinationFilAddress = address
  configStore.set(ConfigKeys.DestinationFilAddress, DestinationFilAddress)
}

module.exports = {
  getOnboardingCompleted,
  setOnboardingCompleted,
  getTrayOperationExplained,
  setTrayOperationExplained,
  getDestinationWalletAddress,
  setDestinationWalletAddress
}
