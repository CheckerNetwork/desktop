import { useSubnets } from 'src/hooks/Subnets'
import SubnetCard from './SubnetCard'
import Text from 'src/components/Text'

const Subnets = () => {
  const { subnets } = useSubnets()

  return (
    <main className='px-9 mt-28 flex flex-col w-[1000px] max-w-full mx-auto'>
      <header className='mb-9'>
        <Text as='h1' font='mono' size='xs' color='primary' uppercase>Subnets ... :</Text>
      </header>
      <section className='grid gap-8 grid-cols-2'>
        {subnets?.map(subnet => <SubnetCard subnet={subnet} key={subnet.id} />)}
      </section>
    </main>
  )
}

export default Subnets
