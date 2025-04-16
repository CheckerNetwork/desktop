import { ReactNode } from 'react'
import BorderedBox from 'src/components/BorderedBox'
import Text from 'src/components/Text'

export const SettingsGroupItem = (
  {
    title,
    description,
    input
  }: {
    title: string;
    description?: string;
    input: ReactNode;
  }
) => {
  return (
    <BorderedBox
      className={`
        flex justify-between items-center py-5 px-10
        border-b-2 last-of-type:border-0 border-dotted border-[#6B6B6B] border-opacity-30
      `}
      isGrouped
    >
      <div className='flex flex-col gap-3 max-w-[485px]'>
        <Text size='4xs' font='title'>{title}</Text>
        {description && (
          <Text size='xs'>{description}</Text>
        )}
      </div>
      {input}
    </BorderedBox>
  )
}

const SettingsGroup = (
  {
    name,
    children
  }: {
    name: string;
    children: ReactNode;
  }) => {
  return (
    <section>
      <Text as='h2' font='title' size='3xs' className='mb-5'>{name}</Text>
      <div>
        {children}
      </div>
    </section>
  )
}

export default SettingsGroup
