import { useEffect, useState } from 'react'
import * as Name from 'w3name'
import SparkLogo from 'src/assets/img/icons/spark-logo.png'
import SaturnLogo from 'src/assets/img/icons/saturn-logo.svg'

/**
 * @returns {Promise<string>} The contract address of the Spark subnet
 */
async function getSparkContractAddress () {
  const name = Name.parse(
    'k51qzi5uqu5dmaqrefqazad0ca8b24fb79zlacfjw2awdt5gjf2cr6jto5jyqe'
  )
  const revision = await Name.resolve(name)
  const address = revision.value.split('\n').filter(Boolean).pop()
  if (typeof address !== 'string') {
    throw new Error('Failed to resolve Spark contract address')
  }
  return address
}

const historicTransfers = 68657304665804877993n + // 11/22/2023
  388040000000000000000n + // 12/07/2023
  759409999999999934464n + // 01/05/2024
  46382279410000003072n + // 01/11/2024
  686460000000000000000n + // 02/01/2024
  916710000000000065536n + // 03/01/2024
  645590000000000065536n + // 03/25/2024
  285779999999999967232n + // 04/04/2024
  73080000000000000000n + // 04/08/2024
  217180000000000000000n + // 04/15/2024
  167640000000000000000n + // 04/22/2024
  239900000000000000000n + // 04/30/2024
  154710000000000000000n + // 05/06/2024
  173690000000000000000n + // 05/13/2024
  208760000000000000000n + // 05/21/2024
  120970000000000000000n + // 05/27/2024
  124380000000000000000n + // 06/03/2024
  188030530100000000000n // 06/11/2024

/**
 * @returns {Promise<bigint>}
 */
const getContractBalanceHeld = async () => {
  const res = await fetch('https://api.node.glif.io/rpc/v0', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer VOeqfEFbUjr/vnvYSwbohKuilNkdmD/4tI3gXzV7f3g='
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [
        {
          to: '0x8460766Edc62B525fc1FA4D628FC79229dC73031',
          data: '0x624c6be7'
        },
        'latest'
      ],
      id: 1
    })
  })
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`)
  const { result } = await res.json()
  return BigInt(result)
}

type TransfersResponse = {
  day: string;
  amount: string;
}[]

/**
 * @returns {Promise<number>}
 */
async function getSparkTransfersFromStats () {
  const res = await fetch(
    'https://stats.filspark.com/transfers/daily' +
      `?from=2024-01-01&to=${new Date().toISOString().split('T')[0]}`
  )
  const stats = await res.json() as TransfersResponse
  return stats.reduce((total, stat) => total + BigInt(stat.amount), 0n)
}

/**
 * @returns {Promise<number>} The total rewards of the Spark subnet
 */
async function getSparkTotalRewards () {
  const [balanceHeld, transfersFromStats] = await Promise.all([
    getContractBalanceHeld(),
    getSparkTransfersFromStats()
  ])
  const total = historicTransfers + transfersFromStats + balanceHeld
  return Number((total / 1_000_000_000_000_000n).toString()) / 1_000
}

/* eslint-disable max-len */
export const subnets = {
  spark: {
    name: 'Spark',
    description: 'Spark is a trustless protocol for sampling retrievals from Filecoin Storage Providers. Spark aims to drive improvements in the retrievability of data stored on Filecoin.',
    contractAddress: '0x8460766Edc62B525fc1FA4D628FC79229dC73031',
    logo: SparkLogo,
    stats: {
      totalJobs: 0, // TODO: Get this from spark-stats once available
      totalRewards: 0,
      rewardsEnabled: true
    },
    links: {
      github: 'https://github.com/filecoin-station/spark',
      docs: 'https://filspark.com/'
    },
    status: 'active'
  },
  voyager: {
    name: 'Voyager',
    description: 'Voyager tests retrievability of content stored on the Saturn decentralized CDN, which is revolutionizing Web3 content delivery. ',
    contractAddress: '0xc524b83bf85021e674a7c9f18f5381179fabaf6c',
    logo: SaturnLogo,
    stats: {
      totalJobs: 0, // TODO: Updater after data export
      totalRewards: 1359.54,
      rewardsEnabled: true
    },
    links: {
      github: 'https://github.com/filecoin-station/voyager',
      docs: 'https://saturn.tech/'
    },
    status: 'ended'
  }
} as const

export type Subnet = (typeof subnets)[keyof typeof subnets] & {id: string}

export const useSubnets = () => {
  const [sparkContractAddress, setSparkContractAddress] = useState<string>()
  const [sparkTotalRewards, setSparkTotalRewards] = useState<number>(0)

  useEffect(() => {
    async function load () {
      setSparkContractAddress(await getSparkContractAddress())
    }
    load()
  }, [])

  useEffect(() => {
    async function load () {
      setSparkTotalRewards(await getSparkTotalRewards())
    }
    load()
  }, [])

  const subnetsUpdated = {
    ...subnets,
    spark: {
      ...subnets.spark,
      contractAddress: sparkContractAddress,
      stats: {
        ...subnets.spark.stats,
        totalRewards: sparkTotalRewards
      }
    }
  }

  return {
    subnets: Object.entries(subnetsUpdated).map(([id, subnet]) => ({ ...subnet, id })) as Subnet[]
  }
}
