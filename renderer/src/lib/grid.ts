type Line = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cp1x: number;
  cp1y: number;
  cp2x: number;
  cp2y: number;
  deform: boolean;
  ease: number;
  nthFromCenter: number;
}

export class Grid {
  canvas = undefined as unknown as HTMLCanvasElement
  ctx = undefined as unknown as CanvasRenderingContext2D
  height = 0
  width = 0
  gridSize = 40
  dashSize = Math.round(this.gridSize / 8)
  rows: Line[] = []
  cols : Line[] = []
  target = { x: 0, y: 0 }
  warp = { x: 0, y: 0, radius: 90, linesAffected: 10 }
  midLine = { x: 0, y: 0 }
  force = 0

  setCanvas ({
    canvas,
    container
  }: {
    canvas: HTMLCanvasElement;
    container: HTMLElement;
  }) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D

    // Ensure the canvas is crisp using device pixel ratio
    // https://gist.github.com/callumlocke/cc258a193839691f60dd
    const dPr = window.devicePixelRatio
    this.width = container.clientWidth
    this.height = container.clientHeight
    this.canvas.width = this.width * dPr
    this.canvas.height = this.height * dPr
    this.canvas.style.width = `${this.width}px`
    this.canvas.style.height = `${this.height}px`
    this.ctx.scale(dPr, dPr)

    this.ctx.imageSmoothingQuality = 'high'
    this.ctx.imageSmoothingEnabled = true
    this.ctx.setLineDash([this.dashSize])

    this.calcPositions()
  }

  calcPositions () {
    this.target = {
      x: this.percent(50, 'x'),
      y: this.percent(10, 'y')
    }
    this.warp.x = this.percent(50, 'x')
    this.warp.y = this.percent(70, 'y')
    this.midLine.x = this.percent(50, 'x')
    this.midLine.y = this.percent(10, 'y')
  }

  updateWarp (config: Record<string, number>) {
    this.warp.linesAffected = config.linesAffected
    this.warp.radius = config.radius
  }

  // Get the point of the grid that matches a percentage of x / y
  percent (val: number, axis: 'y' | 'x') {
    return val * (axis === 'x' ? this.width : this.height) / 100
  }

  // Get the amount of lines within a given size
  lineCount (val: number) {
    return Math.floor(val / this.gridSize)
  }

  getAdjustedGridConfig () {
    const rowCount = this.lineCount(this.height)
    let colCount = this.lineCount(this.width)

    // Ensure the number of columns is odd, so we can have 1 central line
    if (colCount % 2 === 0) {
      colCount++
    }

    // Calculate offset to ensure a symmetric grid
    const colOffsetX = (this.width - (colCount - 1) * this.gridSize) / 2
    const rowOffsetY = (this.height - (rowCount - 1) * this.gridSize) / 2 - this.dashSize / 2

    return {
      colCount,
      warpCenterColIdx: this.lineCount(this.warp.x),
      warpCenterRowIdx: this.lineCount(this.warp.y),
      rowCount,
      colOffsetX,
      rowOffsetY,
      rowOffsetX: -this.dashSize / 2
    }
  }

  calcGridLines () {
    const config = this.getAdjustedGridConfig()
    this.cols = this.calcDimensionLines('col', config)
    this.rows = this.calcDimensionLines('row', config)
  }

  calcDimensionLines (dimension: 'row' | 'col', config: ReturnType<typeof this.getAdjustedGridConfig>) {
    let acc = 0
    const isRow = dimension === 'row'

    return new Array(config[isRow ? 'rowCount' : 'colCount']).fill(null).map((_, index) => {
      const point = index * this.gridSize + config[isRow ? 'rowOffsetY' : 'colOffsetX']
      const nthFromCenter = this.lineCount(Math.abs(this.warp[isRow ? 'y' : 'x'] - point))

      const isPastHalfway = index > config[isRow ? 'warpCenterRowIdx' : 'warpCenterColIdx']
      const deform = Math.abs(nthFromCenter) < this.warp.linesAffected
      let ease = 0

      const progress = isPastHalfway
        ? (this.warp.linesAffected - nthFromCenter - 1) / this.warp.linesAffected
        : (this.warp.linesAffected - nthFromCenter) / this.warp.linesAffected

      const accEase = easeInOutCubic(progress)
      ease = accEase - acc
      acc = accEase

      return {
        x1: isRow ? config.rowOffsetX : point,
        y1: isRow ? point : 0,
        x2: isRow ? this.canvas.width : point,
        y2: isRow ? point : this.height,
        cp1x: isRow ? this.warp.x : point,
        cp1y: isRow ? point : this.warp.y,
        cp2x: isRow ? this.warp.x : point,
        cp2y: isRow ? point : this.warp.y,
        deform,
        ease,
        nthFromCenter
      }
    })
  }

  renderMidLine () {
    this.ctx.lineWidth = 0.8
    this.ctx.strokeStyle = '#4FF8CA'
    this.ctx.beginPath()
    this.ctx.moveTo(this.midLine.x, this.warp.y)
    this.ctx.lineTo(this.midLine.x, this.midLine.y)
    this.ctx.stroke()
  }

  renderCricle (x: number, y: number, size: number) {
    this.ctx.ellipse(
      x,
      y,
      size,
      size,
      Math.PI / 4,
      0,
      2 * Math.PI)
  }

  renderTargetCircles () {
    this.ctx.lineWidth = 0.8
    this.ctx.strokeStyle = '#4FF8CA'
    this.ctx.fillStyle = '#4FF8CA'
    this.ctx.setLineDash([4])
    this.ctx.beginPath()
    this.renderCricle(this.target.x, this.target.y, 4)
    this.ctx.fill()
    this.ctx.beginPath()
    this.renderCricle(this.target.x, this.target.y, 8)
    this.ctx.stroke()
    this.ctx.beginPath()
    this.renderCricle(this.target.x, this.target.y, 20)
    this.ctx.stroke()
  }

  getCurveConfig (axis: 'x' | 'y', line: Line) {
    // Determine at what point the line will start bending
    const bendOffset = this.warp.radius * 2.5
    const bendInStart = this.warp[axis] - bendOffset
    const bendOutEnd = this.warp[axis] + bendOffset
    const bendSize = 200 * Math.abs(line.ease)
    const bendFollow = (this.force / 20) * line.ease

    return {
      bendInStart,
      bendInEnd: bendInStart + bendSize,
      bendInCp: bendInStart + bendSize / 2,
      bendFollow,
      bendOutStart: bendOutEnd - bendSize,
      bendOutCp: bendOutEnd - bendSize / 2,
      bendOutEnd,
      warpApply: line.ease * this.force
    }
  }

  renderGrid () {
    this.ctx.lineWidth = 0.5
    this.ctx.strokeStyle = 'rgba(107,107,107,0.6)'
    this.calcGridLines()
    this.renderDimension(this.rows, 'row')
    this.renderDimension(this.cols, 'col')
  }

  renderDimension (line: Line[], dimension: 'row' | 'col') {
    const isRow = dimension === 'row'

    for (const item of line) {
      this.ctx.beginPath()
      this.ctx.moveTo(item.x1, item.y1)

      if (item.deform) {
        const config = this.getCurveConfig(isRow ? 'x' : 'y', item)
        // line
        this.ctx.lineTo(
          isRow ? config.bendInStart : item.x1,
          isRow ? item.y1 : config.bendInStart
        )
        // curve in
        this.ctx.quadraticCurveTo(
          isRow ? config.bendInCp : item.x1,
          isRow ? item.y1 : config.bendInCp,
          isRow ? config.bendInEnd : item.x1 + config.bendFollow,
          isRow ? item.y1 + config.bendFollow : config.bendInEnd
        )
        // deform
        this.ctx.bezierCurveTo(
          isRow ? item.cp1x : item.cp1x + config.warpApply,
          isRow ? item.cp1y + config.warpApply : item.cp1y,
          isRow ? item.cp2x : item.cp1x + config.warpApply,
          isRow ? item.cp2y + config.warpApply : item.cp2y,
          isRow ? config.bendOutStart : item.x2 + config.bendFollow,
          isRow ? item.y2 + config.bendFollow : config.bendOutStart
        )
        // curve out
        this.ctx.quadraticCurveTo(
          isRow ? config.bendOutCp : item.x2,
          isRow ? item.y2 : config.bendOutCp,
          isRow ? config.bendOutEnd : item.x2,
          isRow ? item.y2 : config.bendOutEnd
        )
        // line
        this.ctx.lineTo(item.x2, item.y2)
      } else {
        this.ctx.lineTo(item.x2, item.y2)
      }

      this.ctx.stroke()
    }
  }

  clear () {
    this.ctx.clearRect(0, 0, this.width, this.height)
  }

  renderAll () {
    this.clear()
    this.renderGrid()
    this.renderTargetCircles()
    this.renderMidLine()
  }

  // Transition between 2 states, transitioning the force value
  // and revealing the midLine
  tweenRender ({
    targetForce,
    duration,
    delay = 0
  }: {
    targetForce: number;
    duration: number;
    delay?: number;
  }) {
    this.midLine.y = this.warp.y
    const args = {
      forceDiff: targetForce - this.force,
      midLineYDiff: this.midLine.y - (this.target.y + 20),
      duration,
      acc: 0,
      frame: 0
    }

    if (delay) {
      this.renderAll()
      setTimeout(() => {
        this.tweenRenderFrame(args)
      }, delay)
    } else {
      this.tweenRenderFrame(args)
    }
  }

  // Handle each transition frame, applying easing
  tweenRenderFrame (args: {
    forceDiff: number;
    midLineYDiff: number;
    duration: number;
    acc: number;
    frame: number;
  }) {
    if (args.frame === args.duration) {
      return
    }

    const progress = args.frame * 100 / args.duration / 100
    const accEase = easeOutCirc(progress)
    const ease = accEase - args.acc
    args.acc = accEase

    this.force += ease * args.forceDiff
    this.midLine.y -= ease * args.midLineYDiff

    args.frame++

    this.renderAll()

    requestAnimationFrame(() => this.tweenRenderFrame(args))
  }
}

// Source: https://easings.net/
export function easeInOutCubic (x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}
export function easeOutCirc (x: number): number {
  return Math.sqrt(1 - Math.pow(x - 1, 2))
}

// Max FIL amount that will cause changes to the grid
const maxFIL = 5
// Max amount of force to warp the grid. If it increases
// too much, the grid starts to break
const maxWarpForce = 700

// Determine warp properties for a given balance. This uses an
// easing function to return a bigger increment in warp for lower balances
export function getGridConfigForBalance (balance: number) {
  const progress = balance / maxFIL

  const config = {
    force: easeOutCirc(progress) * maxWarpForce,
    radius: 90,
    linesAffected: 10
  }

  if (config.force > 600) {
    config.radius = 150
    config.linesAffected = 12
  } else if (config.force > 500) {
    config.radius = 135
    config.linesAffected = 12
  } else if (config.force > 400) {
    config.radius = 110
    config.linesAffected = 12
  } else if (config.force > 300) {
    config.radius = 100
    config.linesAffected = 11
  }

  return config
}
