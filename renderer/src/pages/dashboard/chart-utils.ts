import { PluginChartOptions, Plugin } from 'chart.js'
import { TimeRange } from './ChartController'
import { formatFilValue } from 'src/lib/utils'

export type ExternalToltipHandler = PluginChartOptions<'line'>['plugins']['tooltip']['external']
export type TooltipHandlerArgs = Parameters<ExternalToltipHandler>[0]
export type CustomPlugin = Plugin<'line', unknown>
type DateTimeFormat = keyof typeof dateTimeFormatters

export const colors = {
  black: '#000',
  white: '#000',
  xLine: '#D9D9E4',
  xAxisText: '#5F5A73',
  totalRewardsLine: '#4a7dff',
  totalRewardsBg: '#b5b2f6',
  scheduledBg: '#dddcf5',
  crossLine: '#A0A1BA'
}

export const fonts = {
  body: 'Lato, serif',
  mono: 'IBMPlexMono, mono'
}

export const chartPadding = {
  top: 40
}

// At any given point, chart dataset points are held in an array,
// 0 is totalReceived data, 1 is scheduled data
export const datasetIndex = {
  totalRewards: 0,
  scheduled: 1
} as const

export const dateTimeFormatters = {
  daily: new Intl.DateTimeFormat(window.navigator.language, {
    day: 'numeric', month: 'short'
  }),
  monthly: new Intl.DateTimeFormat(window.navigator.language, {
    month: 'short', year: '2-digit'
  }),
  default: new Intl.DateTimeFormat(window.navigator.language, {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

export function formatDate (value: string | number | Date, type: DateTimeFormat = 'default') {
  return dateTimeFormatters[type].format(new Date(Number(value)))
}

// Format dates on the x axis tick labels
export function formatTickDate (date: string, index: number, timeRange: TimeRange) {
  if (timeRange === '7d') {
    return formatDate(date, 'daily')
  }

  // In month view, show date every at every 4th tick
  if (timeRange === '1m') {
    return index % 4 === 0 ? formatDate(date, 'daily') : ''
  }

  // In year/all view, show date at start of every month
  if (timeRange === '1y' || timeRange === 'all') {
    const dateVal = new Date(date)

    return dateVal.getDate() === 1 ? formatDate(date, 'monthly') : ''
  }

  return formatDate(date)
}

export function isPayoutPoint (allData: number[], index: number) {
  if (index === 0) return false

  return allData[index - 1] < allData[index]
}

export function getTotalPayoutValue (allData: number[], index: number) {
  if (index === 0) return false

  return allData[index] - allData[index - 1]
}

export const getTooltipValues = ({ chart, tooltip }: TooltipHandlerArgs) => {
  const { title, dataPoints, opacity } = tooltip

  const totalReceivedData = dataPoints[datasetIndex.totalRewards]
  const scheduledData = dataPoints[datasetIndex.scheduled]

  const isPayout = isPayoutPoint(
    chart.data.datasets[datasetIndex.totalRewards].data as number[],
    totalReceivedData.dataIndex
  )
  const payoutValue = getTotalPayoutValue(
    chart.data.datasets[datasetIndex.totalRewards].data as number[],
    totalReceivedData.dataIndex
  )
  const { x, y } = scheduledData.element

  return {
    date: title?.[0],
    totalReceived: totalReceivedData.raw as number,
    scheduled: scheduledData.raw as number,
    position: { x, y },
    opacity,
    isPayout,
    payoutValue
  }
}

// Update custom tooltip content imperatively, as this the easiest
// way to integrate with chart.js, and is more efficient for a
// constantly updating element than using regular React practices
export function updateTooltipElement ({
  element,
  date,
  totalReceived,
  scheduled,
  position,
  opacity,
  isPayout,
  payoutValue
}: {
  element: HTMLDivElement;
} & ReturnType<typeof getTooltipValues>) {
  // Tooltip data provides an opacity value that is 0 when the
  // mouse has left the chart area; 1 when inside the chart
  if (opacity === 0) {
    element.style.opacity = '0'
    return
  }

  element.style.opacity = '1'

  const content = element.querySelector<HTMLDivElement>('[data-content]')

  if (content) {
    element.querySelector('[data-date]')?.replaceChildren(
      formatDate(date)
    )
    element.querySelector('[data-totalreceived]')?.replaceChildren(
      `${formatFilValue(totalReceived.toString())} FIL`
    )
    element.querySelector('[data-scheduled-label]')?.replaceChildren(
      isPayout ? 'Rewards received:' : 'Rewards accrued:'
    )
    element.querySelector('[data-scheduled]')?.replaceChildren(
      isPayout
        ? `${formatFilValue(payoutValue.toString())} FIL`
        : `${formatFilValue((scheduled - totalReceived).toString())} FIL`
    )
    content.setAttribute('data-ispayout', isPayout ? 'true' : 'false')
    content.style.transform = `translate(${position.x}px, ${position.y}px)`
  }

  const indicator = element.querySelector<HTMLDivElement>('[data-indicator]')

  if (indicator) {
    indicator.style.transform = `translate(${position.x}px, ${position.y}px)`
  }
}

// Custom plugin to draw cross lines at the highlighted data point position
export const hoverCrossLines: CustomPlugin = {
  id: 'hoverCrossLines',
  afterDatasetsDraw (chart) {
    const { tooltip, ctx, chartArea } = chart

    if (!tooltip?.dataPoints?.length || tooltip.opacity === 0) return

    const { x, y } = tooltip.dataPoints[datasetIndex.scheduled].element

    ctx.strokeStyle = colors.crossLine
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(chartArea.left, y - chart.canvas.offsetTop)
    ctx.lineTo(chartArea.width + chartArea.left, y - chart.canvas.offsetTop)
    ctx.moveTo(x, chartArea.top)
    ctx.lineTo(x, chartArea.top + chartArea.height)
    ctx.stroke()
  }
}

// Custom plugin to draw Filecoin symbols over payout day positions on chart
// Runs once, after dataset lines are drawn
export const renderPayoutEvents: CustomPlugin = {
  id: 'renderPayoutEvents',
  events: [],
  afterDatasetsDraw (chart) {
    const totalRewardsData = chart.data.datasets[datasetIndex.totalRewards].data as number[]
    const imgElement = document.querySelector<HTMLImageElement>('[data-filecoinsymbol]')
    const imgRadiusSize = 12

    for (let index = 0; index < totalRewardsData.length; index++) {
      if (isPayoutPoint(totalRewardsData, index)) {
        const point = chart.getDatasetMeta(datasetIndex.totalRewards).data[index]

        // Ensure symbol stays inside canvas bounds
        const idealStrokeLength = 36
        const strokeEndpoint = Math.max(
          point.y - idealStrokeLength,
          chart.chartArea.top - chartPadding.top + imgRadiusSize
        )

        chart.ctx.strokeStyle = colors.crossLine
        chart.ctx.setLineDash([4, 4])
        chart.ctx.beginPath()
        chart.ctx.moveTo(point.x, point.y)
        chart.ctx.lineTo(point.x, strokeEndpoint)
        chart.ctx.stroke()

        if (imgElement) {
          chart.ctx.drawImage(imgElement, point.x - imgRadiusSize, strokeEndpoint - imgRadiusSize)
        }
      }
    }
  }
}
