import assert from 'node:assert'
import fs from 'node:fs/promises'
import path from 'node:path'
import { subtle, getRandomValues } from 'node:crypto'

/**
 * @param {object} args
 * @param {string} args.secretsDir
 * @param {string} args.passphrase
 * @param {boolean} [args.recreateOnError]
 * @param {import('node:console')} [args.log]
 * @returns {Promise<{publicKey: string, privateKey: string}>}
 */
export async function getStationId ({ secretsDir, passphrase, recreateOnError = false, log = console }) {
  assert.strictEqual(typeof secretsDir, 'string', 'secretsDir must be a string')

  await fs.mkdir(secretsDir, { recursive: true })
  const keystore = path.join(secretsDir, 'station_id')

  try {
    const keypair = await loadKeypair(keystore, passphrase, { log })
    log.error('Loaded Station ID: %s', keypair.publicKey)
    return keypair
  } catch (err) {
    if (recreateOnError || (err.code === 'ENOENT' && err.path === keystore)) {
      if (recreateOnError) console.error(err)
      // the keystore file does not exist, create a new key
      return await generateKeypair(keystore, passphrase, { log })
    } else {
      throw new Error(
        `Cannot load Station ID from file "${keystore}". ${err.message}`,
        { cause: err }
      )
    }
  }
}

/**
 * @param {string} keystore
 * @param {string} passphrase
 * @param {object} args
 * @param {import('node:console')} args.log
 * @returns {Promise<{publicKey: string, privateKey: string}>}
 */
async function loadKeypair (keystore, passphrase, { log }) {
  const ciphertext = await fs.readFile(keystore)
  let plaintext

  if (!passphrase) {
    plaintext = ciphertext
  } else {
    const looksLikeJson =
      ciphertext[0] === '{'.charCodeAt(0) &&
      ciphertext[ciphertext.length - 1] === '}'.charCodeAt(0)

    if (looksLikeJson) {
      const keypair = await tryUpgradePlaintextToCiphertext(passphrase, keystore, ciphertext, { log })
      if (keypair) return keypair
      // fall back and continue the original path to decrypt the file
    }

    try {
      plaintext = await decrypt(passphrase, ciphertext)
    } catch (err) {
      throw new Error(
        'Cannot decrypt Station ID file. Did you configure the correct PASSPHRASE? Alternatively overwrite it using `--recreateStationIdOnError`',
        { cause: err }
      )
    }
  }

  return parseStoredKeys(plaintext)
}

/**
 * @param {string} keystore
 * @param {string} passphrase
 * @param {Buffer} maybeCiphertext
 * @param {object} args
 * @param {import('node:console')} args.log
 * @returns
 */
async function tryUpgradePlaintextToCiphertext (passphrase, keystore, maybeCiphertext, { log }) {
  let keypair
  try {
    keypair = parseStoredKeys(maybeCiphertext)
  } catch (err) {
    // the file seems to be encrypted
    return undefined
  }

  // re-create the keypair file with encrypted keypair
  await storeKeypair(passphrase, keystore, keypair)
  log.error('Encrypted the Station ID file using the provided PASSPHRASE.')
  return keypair
}
/**
 * @param {Buffer | ArrayBuffer} json
 * @returns {{publicKey: string, privateKey: string}}
 */
function parseStoredKeys (json) {
  const storedKeys = JSON.parse(Buffer.from(json).toString())
  assert.strictEqual(typeof storedKeys.publicKey, 'string', 'station_id is corrupted: invalid publicKey')
  assert.strictEqual(typeof storedKeys.privateKey, 'string', 'station_id is corrupted: invalid privateKey')
  return storedKeys
}

/**
 * @param {string} keystore
 * @param {string} passphrase
 * @param {object} args
 * @param {import('node:console')} [args.log]
 * @returns {Promise<{publicKey: string, privateKey: string}>}
 */
async function generateKeypair (keystore, passphrase, { log }) {
  if (!passphrase) {
    log.warn(`
*****************************************************************************************
  The private key of the identity of your Station instance will be stored in plaintext.
  We strongly recommend you to configure PASSPHRASE environment variable to enable
  Station to encrypt the private key stored on the filesystem.
*****************************************************************************************
`)
  }
  const keyPair = /** @type {import('node:crypto').webcrypto.CryptoKeyPair} */ (
    /** @type {unknown} */ (
      await subtle.generateKey({ name: 'ED25519' }, true, ['sign', 'verify'])
    )
  )
  const publicKey = Buffer.from(await subtle.exportKey('spki', keyPair.publicKey)).toString('hex')
  const privateKey = Buffer.from(await subtle.exportKey('pkcs8', keyPair.privateKey)).toString('hex')
  log.error('Generated a new Station ID:', publicKey)
  await storeKeypair(passphrase, keystore, { publicKey, privateKey })
  return { publicKey, privateKey }
}

/**
 * @param {string} keystore
 * @param {string} passphrase
 * @param {{publicKey: string, privateKey: string}} keypair
 */
async function storeKeypair (passphrase, keystore, { publicKey, privateKey }) {
  const plaintext = JSON.stringify({ publicKey, privateKey })
  const ciphertext = passphrase
    ? await encrypt(passphrase, Buffer.from(plaintext))
    : Buffer.from(plaintext)
  await fs.writeFile(keystore, ciphertext)

  const keys = { publicKey, privateKey }
  return keys
}

//
// The implementation below is loosely based on the following articles
// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey#pbkdf2_2
// https://bradyjoslin.com/blog/encryption-webcrypto/
//

/**
 * @param {string} passphrase
 * @param {Uint8Array} salt
 * @returns {Promise<import('node:crypto').webcrypto.CryptoKey>}
 */
async function deriveKeyFromPassphrase (passphrase, salt) {
  // Create a password based key (PBKDF2) that will be used to derive
  // the AES-GCM key used for encryption / decryption.
  const keyMaterial = await subtle.importKey(
    'raw',
    Buffer.from(passphrase),
    'PBKDF2',
    /* extractable: */ false,
    ['deriveKey']
  )

  // Derive the key used for encryption/decryption
  return await subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100_000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    /* extractable: */ true,
    ['encrypt', 'decrypt']
  )
}

/**
 * @param {string} passphrase
 * @param {Buffer} plaintext
 * @returns {Promise<Buffer>}
 */
export async function encrypt (passphrase, plaintext) {
  assert(Buffer.isBuffer(plaintext), 'plaintext must be a Buffer')
  const salt = getRandomValues(new Uint8Array(16))
  const iv = getRandomValues(new Uint8Array(12))

  const key = await deriveKeyFromPassphrase(passphrase, salt)
  const ciphertext = await subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)

  const result = Buffer.alloc(salt.byteLength + iv.byteLength + ciphertext.byteLength)
  result.set(salt, 0)
  result.set(iv, salt.byteLength)
  result.set(new Uint8Array(ciphertext), salt.byteLength + iv.byteLength)
  return result
}

/**
 * @param {string} passphrase
 * @param {Buffer} encryptedData
 * @returns {Promise<ArrayBuffer>}
 */
export async function decrypt (passphrase, encryptedData) {
  assert(Buffer.isBuffer(encryptedData), 'encryptedData must be a Buffer')
  const salt = Uint8Array.prototype.slice.call(encryptedData, 0, 16)
  const iv = Uint8Array.prototype.slice.call(encryptedData, 16, 16 + 12)
  const ciphertext = Uint8Array.prototype.slice.call(encryptedData, 16 + 12)

  const key = await deriveKeyFromPassphrase(passphrase, salt)
  const plaintext = await subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return plaintext
}
