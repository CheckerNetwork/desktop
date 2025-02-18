import { useState, useEffect, useCallback } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router'
import { getOnboardingCompleted, setOnboardingCompleted } from 'src/lib/station-config'
import Onboarding from 'src/components/Onboarding'
import StationLogoLight from 'src/assets/img/station-logo-light.svg?react'
import { ROUTES } from 'src/lib/routes'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const Loading = () => {
  return (
    <div className="fixed bg-grayscale-200 w-full h-full top-0 left-0 loading">
      <div className="flex flex-col justify-center items-center h-full w-full">
        <StationLogoLight width="720px" />
      </div>
    </div>
  )
}

const OnboardingPage = (): JSX.Element => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean|null>()

  useEffect(() => {
    (async () => {
      await sleep(2000)
      setIsOnboardingCompleted(await getOnboardingCompleted())
      setIsLoading(false)
    })()
  }, [navigate])

  useEffect(() => {
    if (isOnboardingCompleted) {
      navigate(ROUTES.dashboard, { replace: true })
    }
  }, [isOnboardingCompleted, navigate])

  const onFinishOnboarding = useCallback(async () => {
    setIsOnboardingCompleted(true)
    await setOnboardingCompleted()
  }, [])

  if (isLoading) {
    return <Loading />
  }

  return (
    <div className="fixed bg-grayscale-200 w-full h-full top-0 left-0">
      <div className="flex justify-center items-center h-full">
        <Onboarding onFinish={onFinishOnboarding} />
      </div>
    </div>
  )
}

export default OnboardingPage
