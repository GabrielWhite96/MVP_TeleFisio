import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { ROUTES } from '@/shared/config/routes'
import { isNativeApp } from './platform'

const EXIT_PATHS = new Set<string>([ROUTES.login, ROUTES.home])

/** Android hardware back: exit on login/home, otherwise history.back(). */
export function NativeHardwareBack() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isNativeApp() || Capacitor.getPlatform() !== 'android') return

    let handle: { remove: () => Promise<void> } | undefined
    void App.addListener('backButton', ({ canGoBack }) => {
      if (EXIT_PATHS.has(location.pathname)) {
        void App.exitApp()
        return
      }
      if (canGoBack) {
        navigate(-1)
        return
      }
      navigate(ROUTES.login, { replace: true })
    }).then((h) => {
      handle = h
    })

    return () => {
      void handle?.remove()
    }
  }, [location.pathname, navigate])

  return null
}
