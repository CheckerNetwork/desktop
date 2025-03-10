import { useCallback, useEffect, useRef } from 'react'
import { Wallet } from 'src/hooks/CheckerWallet'
import { Grid, getGridConfigForBalance } from 'src/lib/grid'
import { FILTransactionProcessing } from 'shared/typings'

// Initialize grid outside component lifecycle,
// so it persists between navigations
const grid = new Grid()

const GridCanvas = ({
  walletBalance,
  destinationFilAddress,
  processingTransaction
}: {
  walletBalance: Wallet['walletBalance'];
  destinationFilAddress: Wallet['destinationFilAddress'];
  processingTransaction?: FILTransactionProcessing;
}) => {
  const ref = useRef<HTMLCanvasElement>(null)

  // On resize, run setup again to correct positioning
  const handleResize = useCallback(() => {
    if (!ref.current?.parentElement) return

    grid.setCanvas({
      canvas: ref.current,
      container: ref.current.parentElement
    })

    if (!destinationFilAddress) {
      grid.clear()
      grid.renderGrid()
    } else {
      grid.renderAll()
    }
  }, [destinationFilAddress])

  useEffect(() => {
    if (ref.current?.parentElement && !grid.canvas?.isConnected) {
      grid.setCanvas({
        canvas: ref.current,
        container: ref.current.parentElement
      })
    }

    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [handleResize])

  useEffect(() => {
    if (!destinationFilAddress) {
      grid.clear()
      grid.renderGrid()
    } else {
      const config = getGridConfigForBalance(Number(walletBalance))
      const isFirstRender = grid.force === 0
      grid.updateWarp(config)
      grid.tweenRender({
        duration: 100,
        targetForce: config.force,
        delay: isFirstRender ? 500 : 0
      })
    }
  }, [destinationFilAddress, walletBalance])

  return (
    <>
      <canvas ref={ref} className='absolute opacity-0 animate-fadeIn'></canvas>
      {processingTransaction?.status === 'processing' && (
        <div className={`absolute w-[70px] aspect-square animate-moveGridBlur 
        top-[50%] right-0 left-0 m-auto rounded-full
        bg-white mix-blend-overlay blur`}
        ></div>
      )}
    </>
  )
}

export default GridCanvas
