import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/entities/notification/api/notification-api'
import { queryKeys } from '@/shared/api/query-keys'
import { pt } from '@/shared/config/i18n/pt'
import { formatDateTime } from '@/shared/lib/dates'
import { Button } from '@/shared/ui/button'
import { EmptyState, LoadingSpinner } from '@/shared/ui/states'

export function NotificationInbox({ userId }: { userId: string }) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.notifications(userId),
    queryFn: () => getNotifications(userId),
  })

  const markOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications(userId) }),
  })

  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications(userId) }),
  })

  const unread = query.data?.filter((n) => !n.read_at).length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{pt.notifications.title}</h1>
        {unread > 0 && (
          <Button variant="outline" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
            {pt.notifications.markAllRead}
          </Button>
        )}
      </div>
      {query.isLoading && <LoadingSpinner />}
      {!query.data?.length && !query.isLoading && <EmptyState title={pt.notifications.empty} />}
      <div className="space-y-3">
        {query.data?.map((n) => (
          <button
            key={n.id}
            type="button"
            className="w-full rounded-lg border p-4 text-left"
            onClick={() => !n.read_at && markOne.mutate(n.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium">{n.title}</p>
              {!n.read_at && <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />}
            </div>
            <p className="text-sm text-[var(--color-muted-foreground)]">{n.body}</p>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{formatDateTime(n.created_at)}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
