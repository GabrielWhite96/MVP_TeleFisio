import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerDeepLinkNavigator, startDeepLinkListener } from './deep-links'
import { isNativeApp } from './platform'

/** Wires React Router navigation to Capacitor deep-link events. */
export function DeepLinkBridge() {
  const navigate = useNavigate()

  useEffect(() => {
    registerDeepLinkNavigator((to) => {
      navigate(to)
    })

    if (isNativeApp()) {
      void startDeepLinkListener()
    }

    return () => {
      registerDeepLinkNavigator(null)
    }
  }, [navigate])

  return null
}
