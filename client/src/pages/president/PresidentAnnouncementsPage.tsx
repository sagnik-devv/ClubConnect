import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, Megaphone, Pin, PinOff, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PresidentLayout } from '../../components/president/PresidentLayout';
import { usePresidentClub } from '../../context/PresidentClubContext';
import { AnnouncementItem, presidentService } from '../../services/president.service';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { EmptyState, ErrorState, PageSkeleton } from '../../components/common/StateFeedback';
import { getApiErrorMessage } from '../../services/api';

export const PresidentAnnouncementsPage: React.FC = () => {
  const { selectedClubId, selectedClub } = usePresidentClub();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AnnouncementItem | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const {
    data: announcements = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['president-announcements', selectedClubId],
    queryFn: () => presidentService.listAnnouncements(selectedClubId),
    enabled: Boolean(selectedClubId),
  });

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setContent('');
    setIsPinned(false);
    setModalOpen(true);
  };

  const openEdit = (item: AnnouncementItem) => {
    setEditing(item);
    setTitle(item.title);
    setContent(item.content);
    setIsPinned(item.isPinned);
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? presidentService.updateAnnouncement(editing.id, { title, content, isPinned })
        : presidentService.createAnnouncement(selectedClubId, { title, content, isPinned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['president-announcements', selectedClubId] });
      queryClient.invalidateQueries({ queryKey: ['member-announcements'] });
      toast.success(
        editing
          ? 'Announcement updated'
          : 'Announcement published and sent to club members'
      );
      setModalOpen(false);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to save announcement'));
    },
  });

  const pinMutation = useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
      presidentService.updateAnnouncement(id, { isPinned: pinned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['president-announcements', selectedClubId] });
      queryClient.invalidateQueries({ queryKey: ['member-announcements'] });
      toast.success('Pin state updated');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to update pin state')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => presidentService.deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['president-announcements', selectedClubId] });
      queryClient.invalidateQueries({ queryKey: ['member-announcements'] });
      toast.success('Announcement deleted');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to delete announcement')),
  });

  return (
    <PresidentLayout>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-[#757575]">
            {selectedClub?.name} · Member Communications
          </p>
          <h1 className="mt-1 text-[32px] font-bold text-black tracking-[-0.03em]">
            Announcements
          </h1>
          <p className="mt-1 text-[15px] text-[#615d59]">
            Publish updates to active club members. Pinned notices stay at the top of the Member Portal.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          New Announcement
        </Button>
      </div>

      {isLoading ? (
        <PageSkeleton />
      ) : isError ? (
        <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />
      ) : announcements.length === 0 ? (
        <EmptyState
          title="No announcements yet"
          description="Share important meeting updates, recruitment calls, or project milestones with your members."
          action={
            <Button variant="primary" size="sm" onClick={openCreate}>
              Publish First Announcement
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => (
            <article
              key={item.id}
              className={`notion-card p-5 space-y-3 ${
                item.isPinned ? 'border-[#0075de]/40 bg-[#e6f3fe]/20' : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.isPinned && (
                      <Badge variant="blue">
                        <Pin className="w-3 h-3 mr-1 inline" />
                        Pinned
                      </Badge>
                    )}
                    <span className="text-[12px] text-[#757575]">
                      Published {new Date(item.publishedAt).toLocaleString()} · By{' '}
                      {item.createdBy.fullName}
                    </span>
                  </div>
                  <h2 className="text-[19px] font-bold text-black flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-[#0075de] shrink-0" />
                    {item.title}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => pinMutation.mutate({ id: item.id, pinned: !item.isPinned })}
                  >
                    {item.isPinned ? (
                      <>
                        <PinOff className="w-3.5 h-3.5" />
                        Unpin
                      </>
                    ) : (
                      <>
                        <Pin className="w-3.5 h-3.5" />
                        Pin
                      </>
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (window.confirm(`Delete announcement "${item.title}"?`)) {
                        deleteMutation.mutate(item.id);
                      }
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-[#f64932]" />
                  </Button>
                </div>
              </div>

              <p className="text-[14px] text-[#2f2d2a] whitespace-pre-wrap leading-relaxed">
                {item.content}
              </p>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Announcement' : 'Publish Club Announcement'}
        maxWidthClass="max-w-lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-[13px] font-medium text-black mb-1">Title</label>
            <input
              required
              minLength={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Weekly Sync Moved to Room 204"
              className="w-full h-10 px-3 rounded-[8px] border border-black/[0.12] text-[14px]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-black mb-1">Message</label>
            <textarea
              required
              minLength={10}
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share details clearly for all active club members..."
              className="w-full p-3 rounded-[8px] border border-black/[0.12] text-[14px]"
            />
          </div>
          <label className="flex items-center gap-2.5 text-[14px] text-black cursor-pointer">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 accent-[#0075de]"
            />
            Pin this announcement to the top of member feeds
          </label>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? 'Saving...'
                : editing
                  ? 'Update Announcement'
                  : 'Publish & Notify Members'}
            </Button>
          </div>
        </form>
      </Modal>
    </PresidentLayout>
  );
};
