import { cn } from '@/shared/lib/utils'

interface OptionChecklistProps {
  options: string[]
  selected: string[]
  onChange: (next: string[]) => void
}

/** Renders nothing until catalogs in clinical-options.ts are filled. */
export function OptionChecklist({ options, selected, onChange }: OptionChecklistProps) {
  if (!options.length) return null

  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt))
    } else {
      onChange([...selected, opt])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={cn(
              'rounded-md border px-2.5 py-1 text-xs',
              active
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                : 'border-[var(--color-border)]'
            )}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}
