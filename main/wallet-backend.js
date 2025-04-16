'use strict'

const keytar = require('keytar')
const { strict: assert } = require('node:assert')
const { ethers } = require('ethers')
const {
  delegatedFromEthAddress,
  ethAddressFromDelegated,
  isEthAddress,
  CoinType
} = require('@glif/filecoin-address')
const fs = require('node:fs/promises')
const { join } = require('node:path')
const { decode } = require('@glif/filecoin-address')
const timers = require('node:timers/promises')
const log = require('electron-log').scope('wallet-backend')
const { format } = require('node:util')

/** @typedef {import('./typings').WalletSeed} WalletSeed */
/**
 * @typedef
 * {import('./typings').BeryxTransactionsResponse}
 * BeryxTransactionsResponse
 */
/** @typedef {import('./typings').BeryxTransaction} BeryxTransaction */
/** @typedef {import('./typings').FILTransaction} FILTransaction */
/** @typedef {
  import('./typings').FILTransactionProcessing
} FILTransactionProcessing */

const DISABLE_KEYTAR = process.env.DISABLE_KEYTAR === 'true'
// eslint-disable-next-line max-len
const BERYX_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImtleS1iZXJ5eC0wMDEiLCJ0eXAiOiJKV1QifQ.eyJyb2xlcyI6W10sImlzcyI6IlpvbmRheCIsImF1ZCI6WyJiZXJ5eCJdLCJleHAiOjE3NDQ5ODIwNDMsImp0aSI6Ikp1bGlhbiBHcnViZXIsanVsaWFuQGp1bGlhbmdydWJlci5jb20ifQ.DJQDNUWkM_1MrhA7xlCKRxIe4dmacfniF15bgHLAJpPr0WJodZ8sse8x_68pEq5GeylWn852KJQKjrdHFf-J8g'

// eslint-disable-next-line @typescript-eslint/no-empty-function
async function noop () {}

/**
 * @param {string} value
 * @returns {value is `f1${string}`}
 */
function startsWithF1 (value) {
  return value.startsWith('f1')
}

class WalletBackend {
  constructor ({
    disableKeytar = DISABLE_KEYTAR,
    onTransactionUpdate = noop
  } = {}) {
    /** @type {ethers.providers.JsonRpcProvider | null} */
    this.provider = null
    /** @type {ethers.Wallet | null} */
    this.signer = null
    /** @type {`0x${string}` | null} */
    this.address = null
    /** @type {string | null} */
    this.addressDelegated = null
    /** @type {(FILTransaction|FILTransactionProcessing)[]} */
    this.transactions = []
    this.disableKeytar = disableKeytar
    this.onTransactionUpdate = onTransactionUpdate
  }

  /**
   * @param {string} [testSeed]
   */
  async setup (testSeed) {
    let seed, isNew
    if (testSeed) {
      seed = testSeed
      isNew = false
    } else {
      ({ seed, isNew } = await this.getSeedPhrase())
    }
    this.provider = new ethers.providers.JsonRpcProvider({
      url: 'https://api.node.glif.io/rpc/v0',
      headers: {
        Authorization: 'Bearer VOeqfEFbUjr/vnvYSwbohKuilNkdmD/4tI3gXzV7f3g='
      }
    })
    this.signer = ethers.Wallet.fromMnemonic(seed).connect(this.provider)
    this.address = /** @type {any} */(this.signer.address)
    assert(this.address !== null)
    this.addressDelegated = delegatedFromEthAddress(this.address, CoinType.MAIN)
    this.filForwarder = new ethers.Contract(
      '0x2b3ef6906429b580b7b2080de5ca893bc282c225',
      await fs.readFile(join(__dirname, 'filforwarder-abi.json'), 'utf8'),
      this.provider
    ).connect(this.signer)
    const SparkImpactEvaluator = await import(
      '@filecoin-station/spark-impact-evaluator'
    )
    this.meridian = new ethers.Contract(
      SparkImpactEvaluator.ADDRESS,
      SparkImpactEvaluator.ABI,
      this.provider
    )

    return { seedIsNew: isNew }
  }

  /**
   * @param {string} service
   */
  async maybeMigrateSeedPhrase (service) {
    try {
      if (await keytar.getPassword(service, 'seed')) {
        return
      }
    } catch {}
    let seed
    try {
      seed = await keytar.getPassword('filecoin-station-wallet-0x', 'seed')
    } catch {}
    if (seed) {
      await keytar.setPassword(service, 'seed', seed)
    }
  }

  /**
   * @returns {Promise<WalletSeed>}
   */
  async getSeedPhrase () {
    const service = 'checker-wallet-0x'
    let seed
    if (!this.disableKeytar) {
      log.info('Reading the seed phrase from the keychain...')
      try {
        await this.maybeMigrateSeedPhrase(service)
        seed = await keytar.getPassword(service, 'seed')
      } catch (err) {
        throw new Error(
          'Cannot read the seed phrase - did the user grant access?',
          { cause: err }
        )
      }

      if (seed) {
        return { seed, isNew: false }
      }
    }

    seed = ethers.Wallet.createRandom().mnemonic.phrase
    if (!this.disableKeytar) {
      await keytar.setPassword(service, 'seed', seed)
    }
    return { seed, isNew: true }
  }

  async fetchBalance () {
    assert(this.signer)
    return await this.signer.getBalance()
  }

  /**
   * @param {string} to
   * @param {ethers.BigNumber} amount
   * @returns {Promise<string>}
   */
  async transferFunds (to, amount) {
    log.info('transferFunds()', { to, amount: amount.toString() })

    if (isEthAddress(to)) {
      return this.transferFundsToEthAddress(to, amount)
    } else if (to.startsWith('f4')) {
      return this.transferFundsToEthAddress(ethAddressFromDelegated(to), amount)
    } else if (startsWithF1(to)) {
      return this.transferFundsToF1Address(to, amount)
    } else {
      throw new Error('Unknown address type')
    }
  }

  /**
   * @param {`f1${string}`} to
   * @param {ethers.BigNumber} amount
   * @returns {Promise<string>}
   */
  async transferFundsToF1Address (to, amount) {
    return await this.runTransaction(to, amount, async () => {
      assert(this.provider)
      assert(this.signer)
      assert(this.filForwarder)

      const [feeData, gasEstimate] = await Promise.all([
        this.provider.getFeeData(),
        this.filForwarder.estimateGas.forward(
          decode(to).bytes,
          { value: ethers.BigNumber.from(0) }
        )
      ])
      assert(feeData.gasPrice)
      assert(feeData.maxFeePerGas)
      const totalGasDeductionInAttoFil = gasEstimate
        .mul(feeData.maxFeePerGas)
        .mul(ethers.BigNumber.from(3))
        .div(ethers.BigNumber.from(2))
      log.info('gas estimate', {
        gasPrice: feeData.gasPrice.toString(),
        maxFeePerGas: feeData.maxFeePerGas.toString(),
        gasEstimate: gasEstimate.toString(),
        totalGasDeductionInAttoFil: totalGasDeductionInAttoFil.toString()
      })
      const amountToSend = amount.sub(totalGasDeductionInAttoFil)
      log.info('filForwarder.forward()', {
        to,
        amountToSend: amountToSend.toString()
      })
      return await this.filForwarder.forward(
        decode(to).bytes,
        { value: amountToSend }
      )
    })
  }

  /**
   * @param {`0x${string}`} to
   * @param {ethers.BigNumber} amount
   * @returns {Promise<string>}
   */
  async transferFundsToEthAddress (to, amount) {
    return await this.runTransaction(to, amount, async () => {
      assert(this.signer)

      const amountMinusGas = amount.sub(ethers.utils.parseEther('0.01'))
      log.info('sendTransaction()', {
        to,
        amount: amount.toString(),
        amountMinusGas: amountMinusGas.toString()
      })
      return await this.signer.sendTransaction({
        to,
        value: amountMinusGas
      })
    })
  }

  /**
   * @param {`f1${string}` | `0x${string}`} to
   * @param {ethers.BigNumber} amount
   * @param {function} fn
   * @returns {Promise<string>}
   */
  async runTransaction (to, amount, fn) {
    assert(this.signer)

    /** @type {FILTransactionProcessing} */
    const transaction = {
      timestamp: new Date().getTime(),
      status: 'processing',
      outgoing: true,
      amount: ethers.utils.formatUnits(amount, 18),
      address: startsWithF1(to)
        ? to
        : delegatedFromEthAddress(to, CoinType.MAIN)
    }
    this.transactions.push(transaction)
    this.onTransactionUpdate()

    try {
      const tx = await fn()
      log.info({ hash: tx.hash })
      assert(tx.hash, 'Transaction hash not found')
      const cid = await this.convertEthTxHashToCid(tx.hash)
      log.info({ cid })
      transaction.hash = cid
      this.onTransactionUpdate()
      return cid
    } catch (err) {
      log.error(format('Cannot submit transaction:', err))
      transaction.status = 'failed'
      this.onTransactionUpdate()
      throw err
    }
  }

  /**
   * @param {string} hash
   * @returns {Promise<string>}
   */
  async convertEthTxHashToCid (hash) {
    log.info('convertEthTxHashToCid', { hash })
    for (let attempt = 0; attempt < 20; attempt++) {
      const res = await fetch(
        `https://api.zondax.ch/fil/data/v3/mainnet/transactions/hash/${hash}`,
        {
          headers: {
            authorization: `Bearer ${BERYX_TOKEN}`
          }
        }
      )
      const body = /** @type {BeryxTransactionsResponse} */ (await res.json())
      const tx = body.transactions?.find(tx => tx.tx_type !== 'Fee')
      if (tx) {
        return tx.tx_cid
      }
      await timers.setTimeout(10_000)
    }
    throw new Error('Could not convert ETH tx hash to CID')
  }

  /**
   * @param {string} address
   * @returns Promise<BeryxTransaction[]>
   */
  async getMessages (address) {
    const types = ['sender', 'receiver']
    const messages = await Promise.all(types.map(async type => {
      const res = await fetch(
        `https://api.zondax.ch/fil/data/v3/mainnet/transactions/address/${address}/${type}`,
        {
          headers: {
            authorization: `Bearer ${BERYX_TOKEN}`
          }
        }
      )
      assert(res.ok, `Could not fetch messages (Status ${res.status})`)
      const { transactions } =
        /** @type {BeryxTransactionsResponse} */ (await res.json())
      return transactions
    }))
    return messages
      .flat()
      .filter(tx => tx.tx_type !== 'Fee')
      .sort((a, b) => {
        return new Date(b.tx_timestamp).getTime() -
          new Date(a.tx_timestamp).getTime()
      })
  }

  /**
   * @returns {Promise<void>}
   */
  async fetchAllTransactions () {
    assert(this.address)

    // Load messages
    const messages = await this.getMessages(this.address)

    /** @type {(FILTransaction|FILTransactionProcessing)[]} */
    const transactions = messages.map(message => {
      assert(this.addressDelegated)
      return {
        height: message.height,
        hash: message.tx_cid,
        outgoing: message.tx_from === this.addressDelegated,
        amount: ethers.utils.formatUnits(BigInt(message.amount), 18),
        address: message.tx_from === this.addressDelegated
          ? message.tx_to
          : message.tx_from,
        timestamp: new Date(message.tx_timestamp).getTime(),
        status: message.status === 'Ok'
          ? 'succeeded'
          : 'failed'
      }
    })

    // Add locally known transactions not yet returned by the API
    for (const transaction of this.transactions) {
      if (
        !transaction.hash ||
        !transactions.find(tx => tx.hash === transaction.hash)
      ) {
        transactions.push(transaction)
      }
    }

    // Update state
    this.transactions = transactions
    this.onTransactionUpdate()
  }
}

module.exports = {
  WalletBackend
}
