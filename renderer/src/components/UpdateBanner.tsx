import { useEffect, useState } from 'react'
import Warning from 'src/assets/img/icons/error.svg?react'
import { openReleaseNotes, restartToUpdate } from 'src/lib/checker-config'

const UpdateBanner = () => {
  const [isReadyToUpdate, setIsReadyToUpdate] = useState<boolean>(false)

  useEffect(() => {
    const reload = async () => {
      const updateStatus = await window.electron.getUpdaterStatus()
      setIsReadyToUpdate(updateStatus.readyToUpdate)
    }

    reload()
    const unsubscribeUpdateNotification = window.electron.checkerEvents.onReadyToUpdate(() => {
      setIsReadyToUpdate(true)
    })

    return unsubscribeUpdateNotification
  }, [])

  if (!isReadyToUpdate) return null
  return (
    <div className="h-14 bg-black top-0 left-0 w-full">
      <div className="h-full max-w-[844px] mx-auto flex flex-row items-center justify-between">
        <div className='flex flex-row items-center gap-1'>
          <Warning width={'12px'} height={'12px'} fill="none" stroke="#fff" />
          <span className='text-white text-body-xs'>
            New version available: Checker will update itself on next launch.
          </span>
        </div>
        <div>
          <span
            onClick={openReleaseNotes}
            className="font-body text-body-xs underline mr-3 text-white hover:text-grayscale-100 cursor-pointer"
          >
            Release notes
          </span>
          <button
            className='py-2 px-8 rounded-full font-body text-body-2xs border border-solid
         text-white hover:bg-grayscale-100 hover:bg-opacity-30 bg-transparent'
            onClick={restartToUpdate}
          >Restart now</button>
        </div>
      </div>
    </div>
  )
}

export default UpdateBanner
