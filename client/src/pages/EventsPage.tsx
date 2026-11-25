import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Calendar, Edit2, MapPin, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { MainLayout } from '../layouts/MainLayout';
import { WorkspaceLayout } from '../layouts/WorkspaceLayout';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/event.service';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { EmptyState, ErrorState, PageSkeleton } from '../components/common/StateFeedback';
import { getApiErrorMessage } from '../services/api';
import { ClubEvent } from '../types';

interface EventFormValues {
  clubId: string;
  title: string;
  description: string;
  location: string;
  category: string;
  startDate: string;
  capacity: number;
}

export const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, hasAnyLeadership, hasClubLeadership, leaderMemberships } = useAuth();

  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ClubEvent | null>(null);

  const { data: events = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventService.listEvents(),
  });

  const filteredEvents = useMemo(() => {
    const now = Date.now();
    return events.filter((ev) => {
      const isPast = new Date(ev.startDate).getTime() < now || ev.status === 'COMPLETED';
      return tab === 'upcoming' ? !isPast : isPast;
    });
  }, [events, tab]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventFormValues>({
    defaultValues: {
      clubId: leaderMemberships[0]?.clubId || '',
      category: 'Workshop',
      capacity: 40,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (vals: EventFormValues) => {
      const startDateIso = new Date(vals.startDate).toISOString();
      if (editingEvent) {
        return eventService.updateEvent(editingEvent.id, {
          title: vals.title.trim(),
          description: vals.description.trim(),
          location: vals.location.trim(),
          category: vals.category,
          startDate: startDateIso,
          capacity: Number(vals.capacity),
        });
      }
      return eventService.createEvent({
        clubId: vals.clubId,
        title: vals.title.trim(),
        description: vals.description.trim(),
        location: vals.location.trim(),
        category: vals.category,
        startDate: startDateIso,
        capacity: Number(vals.capacity),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['student-analytics'] });
      toast.success(editingEvent ? 'Event updated' : 'Event published');
      setModalOpen(false);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to save event'));
    },
  });

  const rsvpMutation = useMutation({
    mutationFn: async (ev: ClubEvent) => {
      if (ev.isRegistered) {
        return eventService.cancelRegistration(ev.id);
      }
      return eventService.register(ev.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['student-analytics'] });
      toast.success('Registration updated');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Could not update registration'));
    },
  });

  const openCreate = () => {
    setEditingEvent(null);
    reset({
      clubId: leaderMemberships[0]?.clubId || '',
      title: '',
      description: '',
      location: '',
      category: 'Workshop',
      startDate: '',
      capacity: 40,
    });
    setModalOpen(true);
  };

  const openEdit = (ev: ClubEvent) => {
    setEditingEvent(ev);
    reset({
      clubId: ev.clubId,
      title: ev.title,
      description: ev.description,
      location: ev.location,
      category: ev.category,
      startDate: ev.startDate.slice(0, 16),
      capacity: ev.capacity,
    });
    setModalOpen(true);
  };

  const content = (
    <div className={isAuthenticated ? '' : 'max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12'}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-[#757575]">Campus Events</p>
          <h1 className="mt-1 text-[32px] sm:text-[42px] font-bold text-black tracking-[-0.035em] leading-tight">
            Show up, collaborate, learn.
          </h1>
        </div>
        {hasAnyLeadership && (
          <Button variant="primary" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Create Event
          </Button>
        )}
      </div>

      <div className="mt-8 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTab('upcoming')}
          className={`px-4 py-2 rounded-[8px] text-[14px] font-medium cursor-pointer ${
            tab === 'upcoming'
              ? 'bg-[#0075de] text-white'
              : 'bg-white border border-black/10 text-[#615d59]'
          }`}
        >
          Upcoming
        </button>
        <button
          type="button"
          onClick={() => setTab('past')}
          className={`px-4 py-2 rounded-[8px] text-[14px] font-medium cursor-pointer ${
            tab === 'past'
              ? 'bg-[#0075de] text-white'
              : 'bg-white border border-black/10 text-[#615d59]'
          }`}
        >
          Past
        </button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <PageSkeleton />
        ) : isError ? (
          <ErrorState
            message={getApiErrorMessage(error, 'Could not fetch events')}
            onRetry={() => refetch()}
          />
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            title={`No ${tab} events`}
            description="Events created by club leaders will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEvents.map((ev) => {
              const canEdit = hasClubLeadership(ev.clubId);
              const isFull = ev.registeredCount >= ev.capacity;

              return (
                <article key={ev.id} className="notion-card p-6 flex flex-col justify-between gap-5">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="blue">{ev.club.name}</Badge>
                        <Badge variant="peach">{ev.category}</Badge>
                        {ev.isRegistered && <Badge variant="green">Registered</Badge>}
                      </div>
                      {canEdit && tab === 'upcoming' && (
                        <button
                          type="button"
                          onClick={() => openEdit(ev)}
                          aria-label={`Edit ${ev.title}`}
                          className="p-1.5 rounded-[6px] text-[#757575] hover:text-black hover:bg-[#f6f5f4] cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <h2 className="mt-3 card-heading font-bold text-black">{ev.title}</h2>
                    <p className="mt-2 text-[14px] text-[#615d59] leading-[1.5]">{ev.description}</p>

                    <div className="mt-4 space-y-1.5 text-[13px] text-[#615d59]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#0075de]" />
                        <span>{new Date(ev.startDate).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#0075de]" />
                        <span>{ev.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#0075de]" />
                        <span>
                          {ev.registeredCount} / {ev.capacity} registered
                        </span>
                      </div>
                    </div>
                  </div>

                  {tab === 'upcoming' && (
                    <div className="pt-4 border-t border-black/[0.08] flex justify-end">
                      <Button
                        variant={ev.isRegistered ? 'secondary' : 'primary'}
                        size="sm"
                        disabled={(!ev.isRegistered && isFull) || rsvpMutation.isPending}
                        onClick={() => {
                          if (!isAuthenticated) {
                            toast.info('Sign in to register for events');
                            navigate('/login');
                            return;
                          }
                          rsvpMutation.mutate(ev);
                        }}
                      >
                        {ev.isRegistered
                          ? 'Cancel Registration'
                          : isFull
                          ? 'Event Full'
                          : 'Register'}
                      </Button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEvent ? 'Edit Event' : 'Create Club Event'}
        subtitle="Members of your club will be notified automatically."
      >
        <form onSubmit={handleSubmit((vals) => saveMutation.mutate(vals))} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ev-club" className="block text-[13px] font-medium mb-1">
                Club
              </label>
              <select
                id="ev-club"
                disabled={Boolean(editingEvent)}
                {...register('clubId', { required: true })}
                className="w-full px-3 py-2 rounded-[8px] border border-black/15 bg-white text-[14px]"
              >
                {leaderMemberships.map((m) => (
                  <option key={m.clubId} value={m.clubId}>
                    {m.club.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ev-cat" className="block text-[13px] font-medium mb-1">
                Category
              </label>
              <select
                id="ev-cat"
                {...register('category')}
                className="w-full px-3 py-2 rounded-[8px] border border-black/15 bg-white text-[14px]"
              >
                <option value="Workshop">Workshop</option>
                <option value="Showcase">Showcase</option>
                <option value="Meetup">Meetup</option>
                <option value="Competition">Competition</option>
                <option value="Onboarding">Onboarding</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="ev-title" className="block text-[13px] font-medium mb-1">
              Event Title *
            </label>
            <input
              id="ev-title"
              type="text"
              {...register('title', { required: 'Title is required' })}
              className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
            />
            {errors.title && <p className="mt-1 text-[12px] text-[#e32d14]">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="ev-desc" className="block text-[13px] font-medium mb-1">
              Description *
            </label>
            <textarea
              id="ev-desc"
              rows={3}
              {...register('description', { required: 'Description is required' })}
              className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ev-start" className="block text-[13px] font-medium mb-1">
                Start Date & Time *
              </label>
              <input
                id="ev-start"
                type="datetime-local"
                {...register('startDate', { required: 'Start date is required' })}
                className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
              />
            </div>
            <div>
              <label htmlFor="ev-cap" className="block text-[13px] font-medium mb-1">
                Capacity *
              </label>
              <input
                id="ev-cap"
                type="number"
                min={1}
                {...register('capacity', { required: true, min: 1 })}
                className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="ev-loc" className="block text-[13px] font-medium mb-1">
              Location *
            </label>
            <input
              id="ev-loc"
              type="text"
              {...register('location', { required: 'Location is required' })}
              className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : editingEvent ? 'Save Event' : 'Publish Event'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );

  return isAuthenticated ? (
    <WorkspaceLayout>{content}</WorkspaceLayout>
  ) : (
    <MainLayout>{content}</MainLayout>
  );
};
