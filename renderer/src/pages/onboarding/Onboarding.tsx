import { useState, useEffect, useCallback } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router'
import { getOnboardingCompleted, setOnboardingCompleted } from 'src/lib/checker-config'
import Onboarding from 'src/components/Onboarding'
import { ROUTES } from 'src/lib/routes'
import CheckerLogo from 'src/assets/img/checker-logo.svg?react'
import OnboardingIllustration from 'src/assets/img/Onboarding Illustration.svg?react'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const OnboardingPage = (): JSX.Element => {
  const navigate = useNavigate()
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean|null>()

  useEffect(() => {
    (async () => {
      let isOnboardingCompleted
      while (true) {
        try {
          isOnboardingCompleted = await getOnboardingCompleted()
          break
        } catch (err) {
          await sleep(100)
        }
      }
      setIsOnboardingCompleted(isOnboardingCompleted)
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

  return (
    <div className="fixed onboarding-bg w-full h-full top-0 left-0">
      <CheckerLogo className="absolute top-[82px] left-[82px] w-[238px]" />
      <OnboardingIllustration className="absolute bottom-[82px] left-0 w-[735px]" />
      <div className="flex justify-center items-center h-full">
        <Onboarding onFinish={onFinishOnboarding} />
      </div>
    </div>
  )
}

export default OnboardingPage
