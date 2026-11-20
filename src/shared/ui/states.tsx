import { cn } from '@/shared/lib/utils'

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-2xl bg-[var(--color-muted)]', className)} {...props} />
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-[var(--color-secondary)] p-5 text-center md:rounded-[1.5rem] md:p-8">
      <h3 className="text-base font-medium md:text-lg">{title}</h3>
      {description && <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{description}</p>}
      {action && <div className="mt-3 md:mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl bg-[var(--color-destructive)]/10 p-4 text-center text-[var(--color-destructive)]">
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-2 text-sm underline">
          Tentar novamente
        </button>
      )}
    </div>
  )
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent', className)} />
  )
}
