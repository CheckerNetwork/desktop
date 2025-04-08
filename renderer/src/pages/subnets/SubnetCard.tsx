import { ReactNode } from 'react'
import Tag from 'src/components/Tag'
import Text from 'src/components/Text'
import { Subnet } from 'src/hooks/Subnets'
import GithubIcon from 'src/assets/img/icons/github.svg?react'
import DocsIcon from 'src/assets/img/icons/docs.svg?react'
import ExplorerIcon from 'src/assets/img/icons/explorer.svg?react'
import { openExplorerLink } from 'src/lib/utils'
import { openExternalURL } from 'src/lib/checker-config'
import BorderedBox from 'src/components/BorderedBox'

const SubnetLink = ({ children, onClick }: {children: ReactNode; onClick: () => void}) => (
  <Text
    as='button'
    type='button'
    size='xs'
    className='flex items-center gap-2'
    onClick={onClick}
  >
    {children}
  </Text>
)

const subnetStatus = {
  active: {
    tagStatus: 'primary',
    text: 'Active'
  },
  ended: {
    tagStatus: 'secondary',
    text: 'Ended'
  }
} as const

const SubnetCard = ({ subnet }: {subnet: Subnet}) => {
  return (
    <BorderedBox className='animate-fadeIn'>
      <div className='h-[276px] flex border-b border-dashed border-[#6B6B6B] border-opacity-70'>
        <div className='py-9 px-5 flex flex-col gap-3 justify-between'>
          <Text as='h2' size="l" font='mono'>{subnet.name}</Text>
          <Text as='p' size="xs" className='text-pretty no-overflow-text line-clamp-6'>
            {subnet.description}
          </Text>
          <div className='mt-auto'>
            <Tag type={subnetStatus[subnet.status].tagStatus}>{subnetStatus[subnet.status].text}</Tag>
          </div>
        </div>
        <figure
          className={
            `flex w-[140px] shrink-0 py-9 px-5 border-l border-dashed border-[#6B6B6B] border-opacity-70
            rounded-tr-xl
          `}
        >
          <img src={subnet.logo} alt={`${subnet.name}'s logo`} className='max-w-[100px] m-auto' />
        </figure>
      </div>
      <div className='flex py-9 px-5'>
        <div className='w-3/5 flex flex-col gap-5'>
          <div className='flex flex-col'>
            <Text font='mono' size="3xs" color='primary' uppercase>&#47;&#47; Rewards given ... :</Text>
            <Text font='mono' size="xs">
              {subnet.stats.rewardsEnabled
                ? `${subnet.stats.totalRewards || '...'} FIL`
                : (<sub>coming soon</sub>)}
            </Text>
          </div>
          <div className='flex flex-col'>
            <Text font='mono' size="3xs" color='primary' uppercase>&#47;&#47; # Jobs done ... :</Text>
            <Text font='mono' size="xs">{subnet.stats.totalJobs || (<sub>coming soon</sub>)}</Text>
          </div>
        </div>
        <div className='flex flex-col gap-6 w-2/5'>
          <SubnetLink onClick={() => openExternalURL(subnet.links.github) }>
            <GithubIcon className='text-primary' />
            Github
          </SubnetLink>
          <SubnetLink onClick={() => openExternalURL(subnet.links.docs) }>
            <DocsIcon className='text-primary' />
            Docs
          </SubnetLink>
          <SubnetLink onClick={() => openExplorerLink(subnet.contractAddress) }>
            <ExplorerIcon className='text-primary' />
            Explorer
          </SubnetLink>
        </div>
      </div>
    </BorderedBox>
  )
}

export default SubnetCard
