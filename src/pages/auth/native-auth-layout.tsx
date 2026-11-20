import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Keyboard } from '@capacitor/keyboard'
import { BrandMark } from '@/shared/ui/brand'
import { isNativeApp } from '@/shared/native'
import { pt } from '@/shared/config/i18n/pt'
import { cn } from '@/shared/lib/utils'

export function NativeAuthLayout({
  children,
  backTo,
}: {
  children: ReactNode
  backTo?: string
}) {
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isNativeApp()) return

    const handles: Array<{ remove: () => Promise<void> }> = []

    void Promise.all([
      Keyboard.addListener('keyboardWillShow', () => setKeyboardOpen(true)),
      Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true)),
      Keyboard.addListener('keyboardWillHide', () => setKeyboardOpen(false)),
      Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false)),
    ]).then((list) => {
      handles.push(...list)
    })

    return () => {
      for (const handle of handles) void handle.remove()
    }
  }, [])

  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target
      if (!(target instanceof HTMLElement)) return
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') return
      window.requestAnimationFrame(() => {
        target.scrollIntoView({ block: 'center', behavior: 'smooth' })
      })
    }

    sheet.addEventListener('focusin', onFocusIn)
    return () => sheet.removeEventListener('focusin', onFocusIn)
  }, [])

  return (
    <div
      className={cn(
        'native-auth relative flex min-h-dvh w-full flex-col bg-[var(--color-ink)] text-[var(--color-ink-foreground)]',
        keyboardOpen && 'is-keyboard-open'
      )}
    >
      <header
        className={cn(
          'flex shrink-0 flex-col items-center justify-end gap-3 px-6 pt-[max(1.25rem,env(safe-area-inset-top))] transition-[padding,gap] duration-200 ease-out',
          keyboardOpen ? 'pb-3' : 'pb-8'
        )}
      >
        <BrandMark
          size={keyboardOpen ? 'md' : 'lg'}
          layout={keyboardOpen ? 'icon' : 'stacked'}
          tone="onDark"
          alt={pt.app.name}
          className="mx-auto self-center"
        />
        {!keyboardOpen ? (
          <p className="max-w-[18rem] text-center text-sm text-[var(--color-ink-foreground)]/78 text-pretty">
            {pt.auth.nativeTagline}
          </p>
        ) : null}
      </header>

      <div
        ref={sheetRef}
        className="native-auth-sheet flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain rounded-t-[2rem] bg-[var(--color-card)] text-[var(--color-foreground)]"
      >
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {backTo ? (
            <Link
              to={backTo}
              className="native-auth-back mb-4 inline-flex h-11 w-fit items-center gap-1 rounded-xl px-1 text-sm font-bold text-[var(--color-muted-foreground)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            >
              <ChevronLeft className="size-5 shrink-0" aria-hidden="true" />
              {pt.common.back}
            </Link>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  )
}

/** Full-bleed ink splash used while auth resolves on native. */
export function NativeAuthBootScreen() {
  return (
    <div
      className="native-auth flex min-h-dvh w-full items-center justify-center bg-[var(--color-ink)]"
      aria-busy="true"
      aria-label={pt.common.loading}
    >
      <BrandMark size="lg" layout="stacked" tone="onDark" alt={pt.app.name} />
    </div>
  )
}
