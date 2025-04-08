import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Chart as ChartType
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { RewardsRecord, sumAllRewards } from 'src/hooks/CheckerRewards'
import { TimeRange } from './ChartController'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ExternalToltipHandler,
  colors,
  fonts,
  formatTickDate,
  hoverCrossLines,
  updateTooltipElement,
  renderPayoutEvents,
  getTooltipValues,
  chartPadding
} from './chart-utils'
import ChartTooltip from './ChartTooltip'
import FilecoinSymbol from 'src/assets/img/icons/filecoin.svg'
import { bigIntFilToNumber } from 'src/lib/utils'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
  LineElement,
  Tooltip
)

function getRewardValue (data: RewardsRecord['totalRewardsReceived'], subnetId: string) {
  if (subnetId === 'all') {
    return bigIntFilToNumber(sumAllRewards(data))
  }

  return bigIntFilToNumber(data[subnetId])
}

const Chart = ({
  historicalRewards,
  timeRange,
  subnetId
}: {
  historicalRewards: RewardsRecord[];
  timeRange: TimeRange;
  subnetId: string;
}) => {
  const [aspectRatio, setAspectRatio] = useState<number>()
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const hasDataInRange = historicalRewards.length > 1

  const chartData = useMemo(() =>
    historicalRewards.reduce<{
      labels: number[];
      totalRewards: number[];
      scheduled: number[];
    }>(
      (acc, record, index) => {
        acc.labels.push(new Date(record.timestamp).getTime())
        acc.totalRewards.push(getRewardValue(record.totalRewardsReceived, subnetId))
        const isPayout = index > 0 && getRewardValue(record.totalRewardsReceived, subnetId) >
          getRewardValue(historicalRewards[index - 1].totalRewardsReceived, subnetId)
        acc.scheduled.push(
          isPayout
            ? getRewardValue(record.totalRewardsReceived, subnetId)
            : getRewardValue(record.totalScheduledRewards, subnetId) +
              getRewardValue(record.totalRewardsReceived, subnetId)
        )
        return acc
      }, {
        labels: [],
        totalRewards: [],
        scheduled: []
      })
  , [historicalRewards, subnetId])

  const onTooltipUpdate = useCallback<ExternalToltipHandler>((args) => {
    if (!tooltipRef.current) {
      return
    }

    updateTooltipElement({
      element: tooltipRef.current,
      ...getTooltipValues(args)
    })
  }, [tooltipRef])

  function setupAspectRatio () {
    // chartjs options accepts an aspect ratio option, which must be calculated
    // based on the parent element
    if (containerRef.current?.parentElement) {
      const { width, height } = containerRef.current?.parentElement.getBoundingClientRect()
      setAspectRatio(width / height)
    }
  }

  const onResize: ChartType['options']['onResize'] = (chart) => {
    if (containerRef.current?.parentElement) {
      const { width, height } = containerRef.current?.parentElement.getBoundingClientRect()
      chart.resize(width, height)
    }
  }

  useEffect(() => {
    setupAspectRatio()
  }, [])

  return (
    <div ref={containerRef} className='relative flex-1 max-w-full flex items-center'>
      {!hasDataInRange && (
        <div className='absolute inset-0 mb-6 flex items-center justify-center'>
          <p className='text-slate-400 text-sm'>
            You have accrued no rewards in the selected period
          </p>
        </div>
      )}
      <ChartTooltip ref={tooltipRef} />
      <img data-filecoinsymbol className='absolute opacity-0' src={FilecoinSymbol} alt="Filecoin symbol" />
      {aspectRatio
        ? (
          <Line
            className='absolute w-full h-full inset-0'
            options={{
              responsive: true,
              maintainAspectRatio: false,
              onResize,
              aspectRatio,
              animation: false,
              plugins: {
                legend: {
                  display: true
                },
                title: {
                  display: false
                },
                tooltip: {
                  enabled: false,
                  external: onTooltipUpdate
                }
              },
              interaction: {
                intersect: false,
                mode: 'index'
              },
              layout: {
                padding: chartPadding,
                autoPadding: false
              },
              scales: {
                y: {
                  ticks: {
                    font: {
                      family: fonts.mono,
                      size: 12
                    },
                    padding: 10,
                    color: colors.white
                  },
                  border: {
                    dash: [4, 4],
                    display: false
                  },
                  grid: {
                    color: colors.xLine,
                    drawTicks: false,
                    drawOnChartArea: hasDataInRange
                  },
                  min: 0
                },
                x: {
                  grid: {
                    drawOnChartArea: false,
                    drawTicks: false,
                    z: 1
                  },
                  border: {
                    display: false
                  },
                  ticks: {
                    color: colors.xAxisText,
                    font: {
                      family: fonts.body,
                      size: 12
                    },
                    align: 'center',
                    padding: 20,
                    maxRotation: 0,
                    autoSkip: false,
                    callback: function (val, index) {
                      return formatTickDate(this.getLabelForValue(Number(val)), index, timeRange)
                    }
                  }
                }
              },
              datasets: {
                line: {
                  pointHoverRadius: 0,
                  pointRadius: 0
                }
              }
            }}
            data={{
              labels: chartData.labels,
              datasets: [
                {
                  label: 'Total rewards received',
                  data: chartData.totalRewards,
                  borderColor: colors.totalRewardsLine,
                  fill: 'start',
                  backgroundColor: colors.totalRewardsBg,
                  stepped: true
                },
                {
                  label: 'Scheduled rewards',
                  data: chartData.scheduled,
                  borderColor: colors.scheduledBg,
                  pointRadius: 0,
                  tension: 0.4,
                  fill: '-1',
                  backgroundColor: colors.scheduledBg
                }
              ]
            }}
            plugins={[hoverCrossLines, renderPayoutEvents]}
          />
        )
        : null}
    </div>
  )
}

export default Chart
