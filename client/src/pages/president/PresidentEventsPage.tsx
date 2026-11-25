import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Edit3, MapPin, Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { PresidentLayout } from '../../components/president/PresidentLayout';
import { usePresidentClub } from '../../context/PresidentClubContext';
import { presidentService } from '../../services/president.service';
import { eventService } from '../../services/event.service';
import { api, getApiErrorMessage } from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { EmptyState, ErrorState, PageSkeleton } from '../../components/common/StateFeedback';
import { ApiResponse, ClubEvent, EventStatus } from '../../types';

interface AttendeeItem {
  id: string;
  registeredAt: string;
  attended: boolean;
  user: {
    id: string;
    fullName: string;
    email: string;
    department: string | null;
    yearOfStudy: string | null;
  };
}

export const PresidentEventsPage: React.FC = () => {
  const { selectedClubId, selectedClub } = usePresidentClub();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<'UPCOMING' | 'PAST' | 'DRAFT'>('UPCOMING');
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ClubEvent | null>(null);
  const [attendeeEvent, setAttendeeEvent] = useState<ClubEvent | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('Workshop');
  const [coverImage, setCoverImage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [capacity, setCapacity] = useState(60);
  const [status, setStatus] = useState<EventStatus>('UPCOMING');

  const {
    data: events = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['president-events', selectedClubId],
    queryFn: () => presidentService.listEvents(selectedClubId),
    enabled: Boolean(selectedClubId),
  });

  const { data: attendees = [], isLoading: loadingAttendees } = useQuery({
    queryKey: ['president-event-attendees', attendeeEvent?.id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<AttendeeItem[]>>(
        `/events/${attendeeEvent?.id}/attendees`
      );
      return res.data.data;
    },
    enabled: Boolean(attendeeEvent?.id),
  });

  const openCreateModal = () => {
    setEditingEvent(null);
    setTitle('');
    setDescription('');
    setLocation('');
    setCategory('Workshop');
    setCoverImage('');
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    setStartDate(nextWeek.toISOString().slice(0, 16));
    setEndDate('');
    setCapacity(60);
    setStatus('UPCOMING');
    setFormOpen(true);
  };

  const openEditModal = (ev: ClubEvent) => {
    setEditingEvent(ev);
    setTitle(ev.title);
    setDescription(ev.description);
    setLocation(ev.location);
    setCategory(ev.category);
    setCoverImage(ev.coverImage || '');
    setStartDate(new Date(ev.startDate).toISOString().slice(0, 16));
    setEndDate(ev.endDate ? new Date(ev.endDate).toISOString().slice(0, 16) : '');
    setCapacity(ev.capacity);
    setStatus(ev.status);
    setFormOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        category: category.trim(),
        coverImage: coverImage.trim() || null,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        capacity: Number(capacity),
        status,
      };
      if (editingEvent) {
        return eventService.updateEvent(editingEvent.id, payload);
      }
      return presidentService.createEvent(selectedClubId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['president-events', selectedClubId] });
      queryClient.invalidateQueries({ queryKey: ['president-dashboard', selectedClubId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success(editingEvent ? 'Event updated' : 'Event created');
      setFormOpen(false);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Could not save event'));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => eventService.updateEvent(id, { status: 'CANCELLED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['president-events', selectedClubId] });
      queryClient.invalidateQueries({ queryKey: ['president-dashboard', selectedClubId] });
      toast.success('Event marked as cancelled');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to cancel event')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventService.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['president-events', selectedClubId] });
      queryClient.invalidateQueries({ queryKey: ['president-dashboard', selectedClubId] });
      toast.success('Event deleted');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to delete event')),
  });

  const filtered = useMemo(() => {
    const now = Date.now();
    if (tab === 'DRAFT') return events.filter((e) => e.status === 'DRAFT');
    if (tab === 'PAST') {
      return events.filter(
        (e) =>
          e.status === 'COMPLETED' ||
          e.status === 'CANCELLED' ||
          (e.status !== 'DRAFT' && new Date(e.startDate).getTime() < now)
      );
    }
    return events.filter(
      (e) =>
        (e.status === 'UPCOMING' || e.status === 'ONGOING') &&
        new Date(e.startDate).getTime() >= now - 24 * 60 * 60 * 1000
    );
  }, [events, tab]);

  return (
    <PresidentLayout>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-[#757575]">
            {selectedClub?.name} · Event Coordination
          </p>
          <h1 className="mt-1 text-[32px] font-bold text-black tracking-[-0.03em]">
            Club Events
          </h1>
          <p className="mt-1 text-[15px] text-[#615d59]">
            Schedule workshops, speaker sessions, and hackathons, and monitor registered attendees.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={openCreateModal}>
          <Plus className="w-4 h-4" />
          Create Event
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['UPCOMING', 'PAST', 'DRAFT'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3.5 py-2 rounded-[8px] text-[13px] font-medium border cursor-pointer transition-colors ${
              tab === t
                ? 'bg-[#0075de] text-white border-[#0075de]'
                : 'bg-white text-[#615d59] border-black/[0.08] hover:text-black'
            }`}
          >
            {t === 'UPCOMING' ? 'Upcoming' : t === 'PAST' ? 'Past & Cancelled' : 'Drafts'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageSkeleton />
      ) : isError ? (
        <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={`No ${tab.toLowerCase()} events`}
          description="Create an event to publish schedules and collect student RSVPs."
          action={
            <Button variant="primary" size="sm" onClick={openCreateModal}>
              Create Event
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((ev) => (
            <div key={ev.id} className="notion-card p-5 flex flex-col justify-between gap-4">
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge
                      variant={
                        ev.status === 'CANCELLED'
                          ? 'coral'
                          : ev.status === 'DRAFT'
                            ? 'neutral'
                            : ev.status === 'COMPLETED'
                              ? 'green'
                              : 'blue'
                      }
                    >
                      {ev.status}
                    </Badge>
                    <Badge variant="marigold">{ev.category}</Badge>
                  </div>
                  <div className="text-[12px] font-semibold text-[#615d59]">
                    {ev.registeredCount} / {ev.capacity} registered
                  </div>
                </div>
                <h3 className="text-[18px] font-bold text-black">{ev.title}</h3>
                <p className="text-[14px] text-[#615d59] line-clamp-2">{ev.description}</p>
                <div className="flex flex-wrap gap-4 text-[12px] text-[#615d59] pt-1">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#0075de]" />
                    {new Date(ev.startDate).toLocaleString()}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#0075de]" />
                    {ev.location}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-black/[0.06] flex flex-wrap items-center justify-between gap-2">
                <Button variant="secondary" size="sm" onClick={() => setAttendeeEvent(ev)}>
                  <Users className="w-3.5 h-3.5" />
                  Attendees ({ev.registeredCount})
                </Button>
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(ev)}>
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                  {ev.status !== 'CANCELLED' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate(ev.id)}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Delete event "${ev.title}"? This cannot be undone.`)) {
                        deleteMutation.mutate(ev.id);
                      }
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-[#f64932]" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Event Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingEvent ? 'Edit Event' : 'Create Club Event'}
        maxWidthClass="max-w-xl"
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
              placeholder="Spring Design Systems Workshop"
              className="w-full h-10 px-3 rounded-[8px] border border-black/[0.12] text-[14px]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-black mb-1">Description</label>
            <textarea
              required
              minLength={10}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What students will build, learn, and bring..."
              className="w-full p-3 rounded-[8px] border border-black/[0.12] text-[14px]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-black mb-1">Location</label>
              <input
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Auditorium B / Zoom"
                className="w-full h-10 px-3 rounded-[8px] border border-black/[0.12] text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-black mb-1">Category</label>
              <input
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Workshop, Hackathon, Social..."
                className="w-full h-10 px-3 rounded-[8px] border border-black/[0.12] text-[14px]"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-black mb-1">Start Date & Time</label>
              <input
                required
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-10 px-3 rounded-[8px] border border-black/[0.12] text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-black mb-1">
                End Date & Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-10 px-3 rounded-[8px] border border-black/[0.12] text-[14px]"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-black mb-1">Capacity</label>
              <input
                required
                type="number"
                min={1}
                max={10000}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-[8px] border border-black/[0.12] text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-black mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
                className="w-full h-10 px-3 rounded-[8px] border border-black/[0.12] text-[14px] bg-white"
              >
                <option value="UPCOMING">UPCOMING (Published)</option>
                <option value="DRAFT">DRAFT (Hidden from members)</option>
                <option value="ONGOING">ONGOING</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-black mb-1">
              Cover Image URL (Optional)
            </label>
            <input
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://..."
              className="w-full h-10 px-3 rounded-[8px] border border-black/[0.12] text-[14px]"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : editingEvent ? 'Save Changes' : 'Create Event'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Attendees Modal */}
      <Modal
        open={Boolean(attendeeEvent)}
        onClose={() => setAttendeeEvent(null)}
        title={attendeeEvent ? `Registered Attendees · ${attendeeEvent.title}` : 'Attendees'}
        maxWidthClass="max-w-lg"
      >
        {loadingAttendees ? (
          <p className="text-[14px] text-[#615d59]">Loading attendees...</p>
        ) : attendees.length === 0 ? (
          <p className="text-[14px] text-[#615d59]">No students have registered for this event yet.</p>
        ) : (
          <div className="divide-y divide-black/[0.06]">
            {attendees.map((att) => (
              <div key={att.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[14px] font-semibold text-black">{att.user.fullName}</div>
                  <div className="text-[12px] text-[#757575]">
                    {att.user.email}
                    {att.user.department ? ` · ${att.user.department}` : ''}
                    {att.user.yearOfStudy ? ` · ${att.user.yearOfStudy}` : ''}
                  </div>
                </div>
                <div className="text-[12px] text-[#615d59]">
                  {new Date(att.registeredAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </PresidentLayout>
  );
};
