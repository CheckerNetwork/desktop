import os from 'node:os'
import assert from 'node:assert'
import { join } from 'node:path'
import { mkdir, chmod, rm, readFile, writeFile, stat } from 'node:fs/promises'
import { fetch, Headers } from 'undici'
import { pipeline } from 'node:stream/promises'
import unzip from 'unzip-stream'
import { createWriteStream } from 'node:fs'
import { moduleBinaries } from './paths.js'
import * as Name from 'w3name'
import { CarReader } from '@ipld/car'
import { validateBlock } from '@web3-storage/car-block-validator'
import { recursive as exporter } from 'ipfs-unixfs-exporter'
import * as tar from 'tar'
import { reportW3NameError } from './telemetry.js'

/** @typedef {import('unzip-stream').UnzipStreamEntry} UnzipStreamEntry */

const { GITHUB_TOKEN } = process.env
const authorization = GITHUB_TOKEN ? `Bearer ${GITHUB_TOKEN}` : undefined

const gateways = [
  'w3s.link',
  'cf-ipfs.com',
  'dweb.link'
]

export const getBinaryModuleExecutable = ({
  module,
  executable
}) => {
  return join(
    moduleBinaries,
    module,
    getExecutableFileName(executable)
  )
}

const getExecutableFileName = executable => {
  return `${executable}${os.platform() === 'win32' ? '.exe' : ''}`
}

export const installBinaryModule = async ({
  module,
  repo,
  distTag,
  executable,
  targets,
  arch
}) => {
  console.log(
    `[${module}] GitHub client: ${authorization ? 'authorized' : 'anonymous'}`
  )
  const target = targets.find(target =>
    target.platform === os.platform() && target.arch === arch
  )
  assert(target, `[${module}] Unsupported platform: ${os.platform()} ${arch}`)

  await mkdir(moduleBinaries, { recursive: true })
  const outFile = join(moduleBinaries, module)

  console.log(`[${module}] ⇣ downloading ${os.platform()} ${arch}`)
  const res = await fetch(
    `https://github.com/${repo}/releases/download/${distTag}/${target.asset}`,
    {
      headers: {
        ...(authorization ? { authorization } : {})
      },
      redirect: 'follow'
    }
  )

  if (res.status >= 300) {
    throw new Error(
      `[${module}] Cannot fetch binary ${os.platform()} ${arch}: ${res.status}\n` +
      await res.text()
    )
  }

  if (!res.body) {
    throw new Error(
      `[${module}] Cannot fetch binary ${os.platform()} ${arch}: no response body`
    )
  }

  if (target.asset.endsWith('tar.gz')) {
    await mkdir(outFile, { recursive: true })
    await pipeline(
      /** @type {any} */(res.body),
      /** @type {any} */(tar.x({ C: outFile }))
    )
  } else {
    await mkdir(join(moduleBinaries, module), { recursive: true })
    const parser = unzip.Parse()
    parser.on('entry', async entry => {
      const executableFileName = getExecutableFileName(executable)
      const outPath = join(moduleBinaries, module, entry.path)
      await pipeline(entry, createWriteStream(outPath))
      if (entry.path === executableFileName) {
        await chmod(outPath, 0o755)
      }
    })
    await pipeline(res.body, parser)
  }
  console.log(`[${module}] ✓ ${outFile}`)
}

async function getLatestCID (ipnsKey) {
  const name = Name.parse(ipnsKey)
  let revision
  try {
    revision = await Name.resolve(name)
  } catch (err) {
    reportW3NameError()
    // These errors aren't actionable
    err.reportToSentry = false
    throw err
  }
  // /ipfs/:cid
  return revision.value.split('/').pop()
}

async function getLastSeenModuleCID ({ module, moduleVersionsDir }) {
  try {
    return await readFile(join(moduleVersionsDir, module), 'utf-8')
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err
    }
  }
  return undefined
}

async function setLastSeenModuleCID ({ module, cid, moduleVersionsDir }) {
  await mkdir(moduleVersionsDir, { recursive: true })
  await writeFile(join(moduleVersionsDir, module), cid)
}

export async function updateSourceFiles ({
  module,
  ipnsKey,
  moduleVersionsDir,
  moduleSourcesDir,
  noCache
}) {
  await mkdir(moduleSourcesDir, { recursive: true })
  const outDir = join(moduleSourcesDir, module)

  const lastSeenCID = await getLastSeenModuleCID({ module, moduleVersionsDir })
  if (lastSeenCID !== undefined) {
    // Use `console.error` because with `--json` stdout needs to be JSON only
    console.error(`[${module}]  ⇣ checking for updates`)
  }

  const cid = await getLatestCID(ipnsKey)
  const isUpdate = lastSeenCID !== cid
  if (!isUpdate) {
    try {
      await stat(join(outDir, 'main.js'))
      console.error(`[${module}]  ✓ no update available`)
      return false
    } catch (err) {
      console.error(`[${module}] Cannot find sources on disk`)
    }
  }

  let res
  for (const gateway of gateways) {
    try {
      const url = `https://${cid}.ipfs.${gateway}?format=car`
      console.error(`[${module}]  ⇣ downloading source files via ${url}`)
      const headers = new Headers()
      if (noCache) headers.append('Cache-Control', 'no-cache')
      res = await fetch(url, {
        signal: AbortSignal.timeout(10_000),
        headers
      })

      if (res.status >= 300) {
        throw new Error(
          `[${module}] Cannot fetch ${module} archive for ${cid}: ${res.status}\n` +
          await res.text()
        )
      }

      if (!res.body) {
        throw new Error(
          `[${module}] Cannot fetch ${module} archive for ${cid}: no response body`
        )
      }
      break
    } catch (err) {
      if (gateway === gateways[gateways.length - 1]) {
        throw new Error(
          `[${module}] Can't download module sources from any gateway`,
          { cause: err }
        )
      } else {
        console.error(err)
      }
    }
  }

  const tarExtractWarnings = []
  const tarExtractEntries = []
  try {
    const reader = await CarReader.fromIterable(res.body)
    const entries = exporter(cid, {
      async get (blockCid) {
        const block = await reader.get(blockCid)
        try {
          await validateBlock(block)
        } catch (err) {
          throw new Error(`Invalid block ${blockCid} of root ${cid}`, {
            cause: err
          })
        }
        return block.bytes
      }
    })
    const { value: entry } = await entries.next()
    assert(entry, `No entries in ${module} archive`)
    // Depending on size, entries might be packaged as `file` or `raw`
    // https://github.com/web3-storage/w3up/blob/e8bffe2ee0d3a59a977d2c4b7efe425699424e19/packages/upload-client/src/unixfs.js#L11
    if (entry.type === 'file' || entry.type === 'raw') {
      await mkdir(outDir, { recursive: true })
      // `{ strip: 1 }` tells tar to remove the top-level directory (e.g. `mod-peer-checker-v1.0.0`)
      await pipeline(
        /** @type {any} */(entry.content()),
        /** @type {any} */(tar.x({
          strip: 1,
          C: outDir,
          onwarn (code, message, data) {
            tarExtractWarnings.push({ code, message, data })
          },
          onReadEntry (entry) {
            tarExtractEntries.push(entry.path)
          }
        }))
      )
      await stat(join(outDir, 'main.js'))
    }
  } catch (err) {
    try {
      await rm(outDir, { recursive: true })
    } catch {
      if (err.code !== 'ENOENT') {
        throw err
      }
    }
    err.tarExtractWarnings = tarExtractWarnings
    err.tarExtractEntries = tarExtractEntries
    throw err
  }

  await setLastSeenModuleCID({ module, cid, moduleVersionsDir })
  console.error(`[${module}]  ✓ ${outDir}`)

  return isUpdate
}
