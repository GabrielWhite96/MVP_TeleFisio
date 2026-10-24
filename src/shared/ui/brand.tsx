import { cn } from '@/shared/lib/utils'
import { pt } from '@/shared/config/i18n/pt'

const sizeStyles = {
  sm: { wrap: 'gap-2', mark: 'size-8', type: 'text-base' },
  md: { wrap: 'gap-2.5', mark: 'size-9', type: 'text-lg' },
  lg: { wrap: 'gap-3', mark: 'size-11', type: 'text-2xl' },
} as const

export function BrandMark({
  size = 'md',
  tone = 'default',
  className,
}: {
  size?: keyof typeof sizeStyles
  tone?: 'default' | 'inverse'
  className?: string
}) {
  const styles = sizeStyles[size]
  const inverse = tone === 'inverse'

  return (
    <div className={cn('flex items-center', styles.wrap, className)}>
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-2xl',
          inverse
            ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
            : 'bg-[var(--color-ink)] text-[var(--color-ink-foreground)]',
          styles.mark
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="size-[55%]" fill="none">
          <path
            d="M4 17C6.2 9.5 17.5 7.5 20 14"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span
        className={cn(
          'font-display font-semibold tracking-tight',
          inverse ? 'text-[var(--color-ink-foreground)]' : 'text-[var(--color-foreground)]',
          styles.type
        )}
      >
        {pt.app.name}
      </span>
    </div>
  )
}
