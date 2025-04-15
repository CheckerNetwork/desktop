import { BigNumber, FilecoinNumber } from '@glif/filecoin-number'
import { browseTransactionTracker } from './checker-config'
import { delegatedFromEthAddress, ethAddressFromDelegated, newFromString } from '@glif/filecoin-address'

export function truncateString (value: string, size = 6) {
  return `${value.slice(0, size)}...${value.slice(-size)}`
}

export function formatFilValue (value = '') {
  const str = new FilecoinNumber(String(value), 'fil')
    .decimalPlaces(6, BigNumber.ROUND_DOWN)
    .toString()
  const [whole, decimal = ''] = str.split('.')
  return `${whole}.${decimal.padEnd(6, '0')}`
}

export function formattedFilToBigInt (value: string) {
  return BigInt(Math.floor(Number(value) * 1e18))
}

export function bigIntFilToNumber (value: bigint) {
  return Number(value) / 1e18
}

export function openExplorerLink (hash?: string) {
  if (hash) browseTransactionTracker(hash)
}

export async function validateAddress (input: string) {
  const checkAddressString = async (address: string) => {
    if (address.startsWith('0x')) {
      delegatedFromEthAddress(address as `0x${string}`)
    } else if (address.startsWith('f4')) {
      ethAddressFromDelegated(address)
    } else if (address.startsWith('f1')) {
      newFromString(address)
    } else {
      throw new Error('Invalid address type')
    }
    const res = await fetch(`https://station-wallet-screening.fly.dev/${address}`)
    if (res.status === 403) {
      throw new Error('Sanctioned address')
    }
  }

  try {
    await checkAddressString(input)

    return true
  } catch {
    return false
  }
}
