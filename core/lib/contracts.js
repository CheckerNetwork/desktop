import timers from 'node:timers/promises'
import pRetry from 'p-retry'
import * as Name from 'w3name'
import { ethers } from 'ethers'
import * as SparkImpactEvaluator from '@filecoin-station/spark-impact-evaluator'
import { reportW3NameError } from './telemetry.js'

const {
  // https://github.com/filecoin-station/contract-addresses
  CONTRACT_ADDRESSES_IPNS_KEY = 'k51qzi5uqu5dmaqrefqazad0ca8b24fb79zlacfjw2awdt5gjf2cr6jto5jyqe'
} = process.env

const DELAY_IN_MINUTES = 10

export const runUpdateContractsLoop = async ({ provider, contracts, onActivity }) => {
  await timers.setTimeout(2_000)
  while (true) {
    try {
      const newContracts = await getContractsWithRetry({ provider })
      contracts.splice(0)
      contracts.push(...newContracts)
    } catch (err) {
      console.error('Failed to update the list of contract addresses. Will retry later.', err)
      onActivity({
        type: 'error',
        message: `Cannot update scheduled rewards. Will retry in ${DELAY_IN_MINUTES} minutes.`
      })
    }

    const delay = DELAY_IN_MINUTES * 60 * 1000
    const jitter = Math.random() * 20_000 - 10_000 // +- 10 seconds
    try {
      await timers.setTimeout(delay + jitter)
    } catch (err) {
      if (err.name === 'AbortError') return
      throw err
    }
  }
}

async function getContractsWithRetry ({ provider }) {
  const contractAddresses = await pRetry(getContractAddresses, {
    retries: 10,
    onFailedAttempt: err => {
      console.error(err)
      console.error('Failed to get contract addresses. Retrying...')
      if (String(err).includes('You are being rate limited')) {
        const delaySeconds = 60 + (Math.random() * 60)
        // Don't DDOS the w3name services
        console.error(
          `Rate limited. Waiting ${delaySeconds} seconds...`
        )
        return timers.setTimeout(delaySeconds * 1000)
      }
    }
  })
  console.error(`Meridian contract addresses: ${contractAddresses.join(', ')}`)
  return contractAddresses.map(address => {
    return new ethers.Contract(address, SparkImpactEvaluator.ABI, provider)
  })
}

async function getContractAddresses () {
  const name = Name.parse(CONTRACT_ADDRESSES_IPNS_KEY)
  let revision
  try {
    revision = await Name.resolve(name)
  } catch (err) {
    reportW3NameError()
    // These errors aren't actionable
    err.reportToSentry = false
    throw err
  }
  return revision.value.split('\n').filter(Boolean)
}
