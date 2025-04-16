'use strict'

const { app } = require('electron')
const electronLog = require('electron-log')
const assert = require('assert')
const { getDestinationWalletAddress } = require('./station-config')
const timers = require('node:timers/promises')
const { format } = require('node:util')
const Store = require('electron-store')
const { WalletBackend } = require('./wallet-backend')
const { ethers } = require('ethers')
const { formatEther } = require('ethers/lib/utils')

/** @typedef {import('./typings').Context} Context */
/** @typedef {import('./typings').FILTransaction} FILTransaction */
/** @typedef {
  import('./typings').FILTransactionProcessing
} FILTransactionProcessing */

const log = electronLog.scope('wallet')
const walletStore = new Store({
  name: 'wallet'
})

const backend = new WalletBackend({
  async onTransactionUpdate () {
    walletStore.set(
      'transactions_0x',
      backend.transactions
        // Don't persist new transactions that don't yet have a hash, as on
        // an app restart these can't be consolidated with the ones returned
        // by the API.
        .filter(tx => tx.hash)
    )
    sendTransactionsToUI()
  }
})
backend.transactions = loadStoredEntries()

/** @type {Context | null} */
let ctx = null
let balance = loadBalance()
let isTransactionProcessing = false

/**
 * @param {Context} _ctx
 */
async function setup (_ctx) {
  ctx = _ctx

  const { seedIsNew } = await backend.setup()
  if (seedIsNew) {
    log.info('Created new seed phrase')
  } else {
    log.info('Using existing seed phrase')
  }

  log.info(format('Address: %s', backend.address))

  ;(async () => {
    while (true) {
      await refreshState()
      await timers.setTimeout(120_000)
    }
  })()
}

async function refreshState () {
  try {
    await updateScheduledRewards()
  } catch (err) {
    log.error('Cannot update scheduled rewards:', err)
  }
  if (!isTransactionProcessing) {
    try {
      await updateBalance()
    } catch (err) {
      log.error('Cannot update balance:', err)
    }
  }
  if (ctx?.isShowingUI) {
    try {
      await backend.fetchAllTransactions()
    } catch (err) {
      log.error('Cannot update transactions:', err)
    }
  }
}

/**
 * @returns {string}
 */
function getBalance () {
  return ethers.utils.formatUnits(balance, 18)
}

/**
 * @returns {string}
 */
function getScheduledRewards () {
  return formatEther(loadScheduledRewards())
}

// Inline `p-debounce.promise` from
// https://github.com/sindresorhus/p-debounce/blob/1ba9d31dd81eee55b93ef67e38b8fa24781df63b/index.js#L38-L53
// since v5 is ESM only.
// This reduces the concurrency of `updateBalance` to 1, to prevent race
// conditions.

/** @type {Promise<void>|undefined} */
let updateBalancePromise
async function updateBalance () {
  if (updateBalancePromise) {
    return updateBalancePromise
  }
  try {
    updateBalancePromise = _updateBalance()
    return await updateBalancePromise
  } finally {
    updateBalancePromise = undefined
  }
}

async function _updateBalance () {
  assert(ctx)
  balance = await backend.fetchBalance()
  walletStore.set('balance_0x', balance.toHexString())
  ctx.balanceUpdate(ethers.utils.formatUnits(balance, 18))
}

/** @type {Promise<void>|undefined} */
let updateScheduledRewardsPromise
async function updateScheduledRewards () {
  if (updateScheduledRewardsPromise) {
    return updateScheduledRewardsPromise
  }
  try {
    updateScheduledRewardsPromise = _updateScheduledRewards()
    return await updateScheduledRewardsPromise
  } finally {
    updateScheduledRewardsPromise = undefined
  }
}

async function _updateScheduledRewards () {
  assert(ctx)
  ctx.setScheduledRewardsForAddress(getScheduledRewards())
}

/**
 * @param {ethers.BigNumber} scheduledRewards
 */
async function setScheduledRewards (scheduledRewards) {
  walletStore.set('scheduled_rewards', scheduledRewards.toHexString())
}

function listTransactions () {
  return getTransactionsForUI(backend.transactions)
}

/**
 * @param {(FILTransaction|FILTransactionProcessing)[]} transactions
 * @returns {(FILTransaction|FILTransactionProcessing)[]}
 */
function getTransactionsForUI (transactions) {
  let processing
  const sent = []

  for (const transaction of transactions) {
    if (
      !processing &&
      transaction.status === 'processing' &&
      transaction.outgoing
    ) {
      processing = transaction
    } else if (transaction.status === 'succeeded') {
      sent.push(transaction)
    }
  }
  const update = [
    ...(processing ? [processing] : []),
    ...sent
  ]

  return update
}

function sendTransactionsToUI () {
  assert(ctx)
  ctx.transactionUpdate(listTransactions())
}

/**
 * @param {string} to
 * @returns {Promise<void>}
 */
async function transferAllFunds (to) {
  assert(ctx)

  isTransactionProcessing = true
  try {
    const cid = await backend.transferFunds(to, balance)
    console.log({ cid })
  } catch (err) {
    log.error('Transferring funds', err)
  } finally {
    isTransactionProcessing = false
  }
}

/*
 * @returns {Promise<void>}
 */
async function transferAllFundsToDestinationWallet () {
  const to = getDestinationWalletAddress()
  assert(to)
  try {
    await transferAllFunds(to)
  } finally {
    await refreshState()
  }
}

/**
 * @returns {Promise<string>}
 */
async function getAddress () {
  while (!backend.addressDelegated) {
    await timers.setTimeout(100)
  }
  return backend.addressDelegated
}

/**
 * @returns {(FILTransaction|FILTransactionProcessing)[]}
 */
function loadStoredEntries () {
  // A workaround to fix false TypeScript errors
  return /** @type {any} */ (walletStore.get('transactions_0x', []))
}

/**
 * @returns {ethers.BigNumber}
 */
function loadBalance () {
  return ethers.BigNumber.from(
    // A workaround to fix false TypeScript errors
    /** @type {string} */ (walletStore.get('balance_0x', '0x0'))
  )
}

function loadScheduledRewards () {
  return ethers.BigNumber.from(
    // A workaround to fix false TypeScript errors
    /** @type {string} */ (walletStore.get('scheduled_rewards', '0x0'))
  )
}

/**
 * @returns {Promise<string>}
 */
async function getSeedPhrase () {
  const { seed } = await backend.getSeedPhrase()
  return seed
}

/**
 * @param {string} seed
 * @returns {Promise<void>}
 */
async function setSeedPhrase (seed) {
  await backend.setSeedPhrase(seed)
  app.relaunch()
  app.exit(0)
}

/**
 * @param {string | ethers.utils.Bytes} message
 * @returns {Promise<string>}
 */
async function signMessage (message) {
  assert(backend.signer, 'backend not initialized')
  return await backend.signer.signMessage(message)
}

module.exports = {
  setup,
  refreshState,
  getAddress,
  getBalance,
  getScheduledRewards,
  setScheduledRewards,
  listTransactions,
  signMessage,
  transferAllFundsToDestinationWallet,
  getTransactionsForUI,
  getSeedPhrase,
  setSeedPhrase
}
