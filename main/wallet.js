'use strict'

const keytar = require('keytar')
const { generateMnemonic } = require('@zondax/filecoin-signing-tools')
const { default: Filecoin, HDWalletProvider } = require('@glif/filecoin-wallet-provider')
const { CoinType } = require('@glif/filecoin-address')
const electronLog = require('electron-log')
const assert = require('assert')
const { request, gql } = require('graphql-request')
const { FilecoinNumber } = require('@glif/filecoin-number')
const { Message } = require('@glif/filecoin-message')
const { getDestinationWalletAddress } = require('./station-config')

/** @typedef {import('./typings').GQLMessage} GQLMessage */
/** @typedef {import('./typings').GQLStateReplay} GQLStateReplay */
/** @typedef {import('bignumber.js').BigNumber} BigNumber */

const log = electronLog.scope('wallet')

let address = ''
/** @type {Filecoin | null} */
let provider = null

/**
 * @returns {Promise<string>}
 */
async function getSeedPhrase () {
  const service = 'filecoin-station-wallet'
  let seed = await keytar.getPassword(service, 'seed')
  if (seed) {
    log.info('Using existing seed phrase')
  } else {
    seed = generateMnemonic()
    await keytar.setPassword(service, 'seed', seed)
    log.info('Created new seed phrase')
  }
  return seed
}

async function setup () {
  const seed = await getSeedPhrase()
  provider = new Filecoin(new HDWalletProvider(seed), {
    apiAddress: 'https://api.node.glif.io/rpc/v0'
  })
  ;[address] = await provider.wallet.getAccounts(
    0,
    1,
    CoinType.MAIN
  )
  log.info('Address: %s', address)
}

/**
 * @returns {Promise<string>}
 */
async function getBalance () {
  assert(provider)
  const balance = await provider.getBalance(address)
  return balance.toFil()
}

async function listTransactions () {
  console.log('listTransactions')
  const url = 'https://graph.glif.link/query'
  const query = gql`
    query Messages($address: String!, $limit: Int!, $offset: Int!) {
      messages(address: $address, limit: $limit, offset: $offset) {
        cid
        to {
          robust
        }
        from {
          robust
        }
        nonce
        height
        method
        params
        value
      }
    }
  `
  const variables = {
    address,
    limit: 100,
    offset: 0
  }
  /** @type {{messages: GQLMessage[]}} */
  const { messages = [] } = await request(url, query, variables)
  console.log({ messages })

  await Promise.all([
    ...messages.map(async message => {
      const query = gql`
        query Tipset($height: Uint64!) {
          tipset(height: $height) {
            minTimestamp
          }
        }
      `
      const variables = {
        height: message.height
      }
      const { tipset } = await request(url, query, variables)
      message.timestamp = tipset.minTimestamp * 1000
    }),
    ...messages.map(async message => {
      const query = gql`
        query StateReplay($cid: String!) {
          stateReplay(cid: $cid) {
            receipt {
              return
              exitCode
              gasUsed
            }
            executionTrace {
              executionTrace
            }
          }
        }
      `
      const variables = {
        cid: message.cid
      }
      /** @type {{stateReplay: GQLStateReplay}} */
      const { stateReplay } = await request(url, query, variables)
      message.exitCode = stateReplay.receipt.exitCode
    })
  ])

  const transactions = messages
    .map(message => ({
      hash: message.cid,
      timestamp: message.timestamp,
      status: message.exitCode === 0 ? 'sent' : 'failed',
      outgoing: message.from.robust === address,
      amount: new FilecoinNumber(message.value, 'attofil').toFil(),
      address: message.from.robust === address
        ? message.to.robust
        : message.from.robust
    }))
    .filter(transaction => transaction.status === 'sent')

  console.log({ transactions })
  return transactions
}

/**
 * @param {string} from
 * @param {string} to
 * @param {FilecoinNumber} amount
 * @returns Promise<FilecoinNumber>
 */
async function getGasLimit (from, to, amount) {
  assert(provider)
  const message = new Message({
    to,
    from,
    nonce: 0,
    value: amount.toAttoFil(),
    method: 0,
    params: ''
  })
  const messageWithGas = await provider.gasEstimateMessageGas(
    message.toLotusType()
  )
  console.log({ messageWithGas, gasLimit: messageWithGas.gasLimit, ret: new FilecoinNumber(messageWithGas.gasLimit, 'attofil').toFil() })
  return new FilecoinNumber(messageWithGas.gasLimit, 'attofil')
}

/**
 * @param {string} from
 * @param {string} to
 * @param {FilecoinNumber} amount
 * @returns {Promise<string>}
 */
async function transferFunds (from, to, amount) {
  console.log({ transferAmount: amount.toString() })
  assert(provider)
  const gasLimit = await getGasLimit(from, to, amount)
  const message = new Message({
    to,
    from,
    nonce: await provider.getNonce(from),
    value: amount.minus(gasLimit).toAttoFil(),
    method: 0,
    params: ''
  })
  console.log({ messageAfterGasSubtracted: message, value: message.value.toString() })
  const messageWithGas = await provider.gasEstimateMessageGas(
    message.toLotusType()
  )
  const lotusMessage = messageWithGas.toLotusType()
  const msgValid = await provider.simulateMessage(lotusMessage)
  assert(msgValid, 'Message is invalid')
  const signedMessage = await provider.wallet.sign(from, lotusMessage)
  const { '/': cid } = await provider.sendMessage(signedMessage)
  console.log({ CID: cid })
  return cid
}

/*
 * @returns {Promise<void>}
 */
async function transferAllFundsToDestinationWallet () {
  assert(provider)
  const to = getDestinationWalletAddress()
  assert(to)
  const balance = await provider.getBalance(address)
  await transferFunds(address, to, balance)
}

/**
 * @returns {string}
 */
function getAddress () {
  return address
}

module.exports = {
  setup,
  getAddress,
  getBalance,
  listTransactions,
  transferAllFundsToDestinationWallet
}
