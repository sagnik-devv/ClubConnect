import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { WorkspaceLayout } from '../layouts/WorkspaceLayout';
import { notificationService } from '../services/notification.service';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { EmptyState, ErrorState, PageSkeleton } from '../components/common/StateFeedback';
import { getApiErrorMessage } from '../services/api';

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const { data: items = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: () => notificationService.list(filter),
  });

  const markReadMutation = useMutation({
    mutationFn: ({ id, isRead }: { id: string; isRead: boolean }) =>
      notificationService.markRead(id, isRead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to update notification'));
    },
  });

  const markAllMutation = useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
      toast.success('All notifications marked as read');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: notificationService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
      toast('Notification removed');
    },
  });

  return (
    <WorkspaceLayout>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-[#757575]">Notification Centre</p>
          <h1 className="mt-1 text-[32px] sm:text-[42px] font-bold text-black tracking-[-0.035em] leading-tight">
            Real-time & stored updates.
          </h1>
        </div>
        <Button
          variant="secondary"
          onClick={() => markAllMutation.mutate()}
          disabled={markAllMutation.isPending}
        >
          <CheckCheck className="w-4 h-4" />
          Mark all as read
        </Button>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {(['all', 'unread', 'read'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-[8px] text-[14px] font-medium capitalize cursor-pointer ${
              filter === tab
                ? 'bg-[#0075de] text-white'
                : 'bg-white border border-black/10 text-[#615d59]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {isLoading ? (
          <PageSkeleton />
        ) : isError ? (
          <ErrorState
            message={getApiErrorMessage(error, 'Could not load notifications')}
            onRetry={() => refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="No notifications"
            description="Updates for applications, tasks, contributions, and events will appear here."
          />
        ) : (
          <div className="space-y-3">
            {items.map((notif) => (
              <article
                key={notif.id}
                className={`notion-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  !notif.isRead ? 'bg-white border-[#0075de]/25' : 'bg-[#faf9f8]'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-[8px] bg-[#f6f5f4] border border-black/[0.08] flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4 text-[#0075de]" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[15px] font-semibold text-black">{notif.title}</h2>
                      {!notif.isRead && <Badge variant="blue">Unread</Badge>}
                      <Badge variant="neutral">{notif.type}</Badge>
                    </div>
                    <p className="mt-1 text-[14px] text-[#615d59]">{notif.message}</p>
                    <div className="mt-1.5 text-[12px] text-[#757575]">
                      {new Date(notif.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      markReadMutation.mutate({ id: notif.id, isRead: !notif.isRead })
                    }
                    className="px-3 py-1.5 rounded-[8px] border border-black/15 bg-white text-[13px] font-medium text-[#615d59] hover:text-black cursor-pointer"
                  >
                    {notif.isRead ? 'Mark unread' : 'Mark read'}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(notif.id)}
                    aria-label="Delete notification"
                    className="p-2 rounded-[8px] text-[#757575] hover:text-[#e32d14] hover:bg-[#f64932]/10 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </WorkspaceLayout>
  );
};
