'use strict'

const assert = require('node:assert')

/**
   * @param {string | number | undefined} input
   * @returns {number}
*/
// Keep in sync with renderer/src/number-ops.ts
function formatTokenValue (input) {
  const number = Number(input)
  if (!input) return 0
  if (Number.isInteger(number)) return number
  // decimal cases below
  return Number(number.toFixed(6))
}

const allowedURLs = [
  'https://filspark.com/',
  'https://github.com/CheckerNetwork/voyager',
  'https://github.com/CheckerNetwork/spark',
  'https://beryx.io',
  'https://docs.checker.network/checker-network-terms-conditions',
  'https://checker.network',
  'https://docs.checker.network',
  'https://blog.checker.network/posts/why-web3-needs-the-checker-network'
].map(str => new URL(str))

const allowedURLsRegEx = [
  /https:\/\/beryx.zondax.ch\/v1\/search\/fil\/mainnet\/address\/.*$/
].map(str => new RegExp(str))

/**
   * @param {string} url
*/
function validateExternalURL (url) {
  const normalizedURL = new URL(url).href
  assert(
    allowedURLs.find(item => normalizedURL === item.href) ||
    allowedURLsRegEx.find(pattern => pattern.test(normalizedURL)))
}

module.exports = {
  formatTokenValue,
  validateExternalURL
}
