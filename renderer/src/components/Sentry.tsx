import { useEffect } from 'react'
import * as Sentry from '@sentry/react'

const SentryComponent = () => {
  useEffect(() => {
    // Disable Sentry integration for dev builds
    if (window.electron.checkerBuildVersion.endsWith('-dev')) { return }

    Sentry.init({
      dsn: 'https://8667b1c7749ae24e35ba531bffa3ed7a@o1408530.ingest.us.sentry.io/6762462',
      integrations: [Sentry.browserTracingIntegration()],
      release: window.electron.checkerBuildVersion,
      // Set tracesSampleRate to 1.0 to capture 100%
      // of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: 0.1
    })
  }, [])

  return null
}

export default SentryComponent
