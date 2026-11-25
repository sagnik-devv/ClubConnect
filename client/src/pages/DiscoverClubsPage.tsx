import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, List, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';
import { MainLayout } from '../layouts/MainLayout';
import { AnimatedHeadline } from '../components/animations/AnimatedHeadline';
import { ClubCard } from '../components/clubs/ClubCard';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { EmptyState, ErrorState, PageSkeleton } from '../components/common/StateFeedback';
import { clubService } from '../services/club.service';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../services/api';

const CATEGORIES = [
  'All',
  'Technology',
  'Engineering',
  'Arts & Media',
  'Business',
  'Culture',
  'Debate & Policy',
  'Design',
  'Sports',
  'Literature',
  'Innovation',
];

interface CreateClubValues {
  name: string;
  category: string;
  shortDescription: string;
  description: string;
  expectedTimeCommitment: string;
  meetingSchedule: string;
  location: string;
  skillsText: string;
  requirementsText: string;
}

export const DiscoverClubsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, refreshSession } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Open' | 'Closed'>('All');
  const [sortBy, setSortBy] = useState<'members' | 'name' | 'recruiting'>('members');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['clubs', { search, selectedCategory, selectedStatus, sortBy, page }],
    queryFn: () =>
      clubService.listClubs({
        search: search || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        recruiting: selectedStatus !== 'All' ? selectedStatus : undefined,
        sort: sortBy,
        page,
        limit: 9,
      }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateClubValues>({
    defaultValues: {
      category: 'Technology',
      expectedTimeCommitment: '3–4 hrs / week',
    },
  });

  const createMutation = useMutation({
    mutationFn: clubService.createClub,
    onSuccess: async (club) => {
      await refreshSession();
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      toast.success(`${club.name} created!`);
      reset();
      setCreateOpen(false);
      navigate(`/clubs/${club.slug}`);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Unable to create club'));
    },
  });

  const onCreateSubmit = (values: CreateClubValues) => {
    createMutation.mutate({
      name: values.name.trim(),
      category: values.category,
      shortDescription: values.shortDescription.trim(),
      description: values.description.trim(),
      expectedTimeCommitment: values.expectedTimeCommitment.trim(),
      meetingSchedule: values.meetingSchedule.trim() || undefined,
      location: values.location.trim() || undefined,
      skills: values.skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      requirements: values.requirementsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      isRecruiting: true,
    });
  };

  const joinedClubIds = new Set(
    (user?.memberships ?? []).filter((m) => m.status === 'ACTIVE').map((m) => m.clubId)
  );

  const clubs = data?.items ?? [];
  const pagination = data?.pagination;

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedStatus('All');
    setSortBy('members');
    setPage(1);
  };

  const hasFilters = search !== '' || selectedCategory !== 'All' || selectedStatus !== 'All';

  return (
    <MainLayout>
      <section className="py-12 sm:py-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-[13px] font-semibold uppercase tracking-wider text-[#757575] mb-3">
                Discover Campus Communities
              </p>
              <AnimatedHeadline
                as="h1"
                text="Find your people. Discover your thing."
                className="section-heading text-[38px] sm:text-[50px] lg:text-[54px] font-bold text-black"
              />
              <p className="mt-4 text-[18px] text-[#615d59] font-editorial">
                Explore campus communities, find your interests, and discover where you belong.
              </p>
            </div>

            {isAuthenticated && (
              <Button variant="primary" onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4" />
                Create Club
              </Button>
            )}
          </div>

          {/* Search & Filters */}
          <div className="mt-10 notion-card p-5 space-y-4">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#757575] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search clubs by name, description, or skill..."
                  aria-label="Search clubs"
                  className="w-full pl-10 pr-4 py-2.5 rounded-[8px] border border-black/15 bg-[#f6f5f4]/60 text-[14px] focus:bg-white focus:outline-none focus:border-[#0075de]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  aria-label="Filter by recruitment status"
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value as 'All' | 'Open' | 'Closed');
                    setPage(1);
                  }}
                  className="px-3 py-2.5 rounded-[8px] border border-black/15 bg-white text-[14px]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Open">Recruiting</option>
                  <option value="Closed">Closed</option>
                </select>

                <select
                  aria-label="Sort clubs"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'members' | 'name' | 'recruiting')}
                  className="px-3 py-2.5 rounded-[8px] border border-black/15 bg-white text-[14px]"
                >
                  <option value="members">Sort: Most Members</option>
                  <option value="recruiting">Sort: Recruiting First</option>
                  <option value="name">Sort: Name (A–Z)</option>
                </select>

                <div
                  className="inline-flex rounded-[8px] border border-black/15 bg-[#f6f5f4] p-0.5"
                  role="group"
                  aria-label="View mode"
                >
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                    className={`p-2 rounded-[6px] cursor-pointer ${
                      viewMode === 'grid' ? 'bg-white text-black' : 'text-[#757575]'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                    className={`p-2 rounded-[6px] cursor-pointer ${
                      viewMode === 'list' ? 'bg-white text-black' : 'text-[#757575]'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#757575] mr-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Categories:
              </span>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-full text-[13px] font-medium transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#0075de] text-white'
                      : 'bg-[#f6f5f4] text-[#615d59] hover:text-black hover:bg-black/[0.06]'
                  }`}
                >
                  {cat}
                </button>
              ))}
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="ml-auto inline-flex items-center gap-1 text-[13px] font-medium text-[#0075de] hover:underline cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear filters
                </button>
              )}
            </div>
          </div>

          <div className="mt-8">
            {isLoading ? (
              <PageSkeleton />
            ) : isError ? (
              <ErrorState
                message={getApiErrorMessage(error, 'Could not fetch clubs')}
                onRetry={() => refetch()}
              />
            ) : clubs.length === 0 ? (
              <EmptyState
                title="No clubs found"
                description={
                  hasFilters
                    ? 'No clubs match your current search or filter settings.'
                    : 'No clubs have been created yet. Launch the first club workspace on campus.'
                }
                action={
                  hasFilters ? (
                    <Button variant="secondary" onClick={clearFilters}>
                      Reset filters
                    </Button>
                  ) : isAuthenticated ? (
                    <Button variant="primary" onClick={() => setCreateOpen(true)}>
                      <Plus className="w-4 h-4" />
                      Create First Club
                    </Button>
                  ) : (
                    <Button variant="primary" to="/register">
                      Create Account to Start a Club
                    </Button>
                  )
                }
              />
            ) : (
              <>
                <div className="mb-4 text-[14px] text-[#615d59]">
                  Showing <strong className="text-black">{clubs.length}</strong> of{' '}
                  {pagination?.total ?? clubs.length} clubs
                </div>

                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clubs.map((club) => (
                      <ClubCard
                        key={club.id}
                        club={club}
                        viewMode="grid"
                        isJoined={joinedClubIds.has(club.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {clubs.map((club) => (
                      <ClubCard
                        key={club.id}
                        club={club}
                        viewMode="list"
                        isJoined={joinedClubIds.has(club.id)}
                      />
                    ))}
                  </div>
                )}

                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <span className="text-[14px] text-[#615d59]">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a Club"
        subtitle="You will be registered as this club's initial President."
      >
        <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dc-name" className="block text-[13px] font-medium mb-1">
                Club Name *
              </label>
              <input
                id="dc-name"
                type="text"
                {...register('name', { required: 'Name is required' })}
                className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
              />
              {errors.name && <p className="mt-1 text-[12px] text-[#e32d14]">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="dc-cat" className="block text-[13px] font-medium mb-1">
                Category
              </label>
              <select
                id="dc-cat"
                {...register('category')}
                className="w-full px-3 py-2 rounded-[8px] border border-black/15 bg-white text-[14px]"
              >
                {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="dc-short" className="block text-[13px] font-medium mb-1">
              Short Summary *
            </label>
            <input
              id="dc-short"
              type="text"
              {...register('shortDescription', { required: 'Summary is required' })}
              className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
            />
          </div>

          <div>
            <label htmlFor="dc-desc" className="block text-[13px] font-medium mb-1">
              Full Description *
            </label>
            <textarea
              id="dc-desc"
              rows={3}
              {...register('description', { required: 'Description is required' })}
              className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="dc-time" className="block text-[13px] font-medium mb-1">
                Time Commitment
              </label>
              <input
                id="dc-time"
                type="text"
                {...register('expectedTimeCommitment')}
                className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
              />
            </div>
            <div>
              <label htmlFor="dc-schedule" className="block text-[13px] font-medium mb-1">
                Meeting Schedule
              </label>
              <input
                id="dc-schedule"
                type="text"
                placeholder="Wed 6 PM"
                {...register('meetingSchedule')}
                className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
              />
            </div>
            <div>
              <label htmlFor="dc-loc" className="block text-[13px] font-medium mb-1">
                Location
              </label>
              <input
                id="dc-loc"
                type="text"
                placeholder="Lab 204"
                {...register('location')}
                className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="dc-skills" className="block text-[13px] font-medium mb-1">
              Skills Developed (comma-separated)
            </label>
            <input
              id="dc-skills"
              type="text"
              placeholder="React, TypeScript, System Design"
              {...register('skillsText')}
              className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
            />
          </div>

          <div>
            <label htmlFor="dc-reqs" className="block text-[13px] font-medium mb-1">
              Member Expectations (one per line)
            </label>
            <textarea
              id="dc-reqs"
              rows={2}
              placeholder="Attend weekly build sync&#10;Complete 2 tasks per month"
              {...register('requirementsText')}
              className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Club'}
            </Button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
};
