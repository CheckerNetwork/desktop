import { forwardRef } from 'react'
import Text from 'src/components/Text'

const ChartTooltip = forwardRef<HTMLDivElement>(function (_, ref) {
  return (
    <div ref={ref} className='absolute top-0 left-0 pointer-events-none opacity-0 z-100'>
      <div data-indicator className='relative w-5 h-5'>
        <div className={`w-2 h-2 rounded-full bg-primary absolute inset-0
        -translate-x-[50%] -translate-y-[50%]`}
        >
        </div>
        <div className={`w-5 h-5 rounded-full border border-primary border-dashed
        -translate-x-[50%] -translate-y-[50%] absolute inset-0 opacity-50`}
        ></div>
      </div>

      <div
        data-content
        className="transition-transform duration-200 ease-linear group absolute h-0"
      >
        <div className={`flex flex-col gap-2 p-3 rounded-lg w-[200px] border transition-all
        -translate-x-[50%] -translate-y-[150%] bg-white`}
        >
          <Text
            data-date
            size='3xs'
            color='gray'
          >{' '}
          </Text>
          <div>
            <Text
              size='3xs'
              color='gray'
              uppercase
              className={'block'}
            >
              Total rewards received:
            </Text>
            <Text
              size='xs'
              data-totalreceived
              color='black'
              className='block'
            >{' '}
            </Text>
          </div>
          <div>
            <Text
              size='3xs'
              color='gray'
              uppercase
              className={'block'}
              data-scheduled-label
            >
              Rewards accrued:
            </Text>
            <Text
              size='xs'
              color='black'
              data-scheduled
              className={'block'}
            >{' '}
            </Text>
          </div>
        </div>
      </div>
    </div>
  )
})

ChartTooltip.displayName = 'ChartTooltip'

export default ChartTooltip
