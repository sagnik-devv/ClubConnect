import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Award, Save, Shield, Users } from 'lucide-react';
import { toast } from 'sonner';
import { PresidentLayout } from '../../components/president/PresidentLayout';
import { usePresidentClub } from '../../context/PresidentClubContext';
import { useAuth } from '../../context/AuthContext';
import { presidentService } from '../../services/president.service';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  CLUB_AVATAR_PREFIX,
  ClubAvatarPicker,
  getClubAvatarByValue,
} from '../../components/common/CharacterMarks';
import { ErrorState, PageSkeleton } from '../../components/common/StateFeedback';
import { getApiErrorMessage } from '../../services/api';
import { ContributionType } from '../../types';

const CONTRIBUTION_TYPES: ContributionType[] = [
  'TASK',
  'EVENT',
  'PROJECT',
  'LEADERSHIP',
  'VOLUNTEERING',
  'OTHER',
];

const DEFAULT_POINTS: Record<ContributionType, number> = {
  TASK: 10,
  EVENT: 15,
  PROJECT: 25,
  LEADERSHIP: 20,
  VOLUNTEERING: 15,
  OTHER: 10,
};

export const PresidentSettingsPage: React.FC = () => {
  const { selectedClubId, selectedClub } = usePresidentClub();
  const { refreshSession } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [category, setCategory] = useState('');
  const [logo, setLogo] = useState('');
  const [accentColor, setAccentColor] = useState('#e6f3fe');
  const [isRecruiting, setIsRecruiting] = useState(true);
  const [requireVerification, setRequireVerification] = useState(true);
  const [pointsConfig, setPointsConfig] = useState<Record<ContributionType, number>>(DEFAULT_POINTS);
  const [transferTargetUserId, setTransferTargetUserId] = useState('');

  const { data: clubDetail, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['president-club-detail', selectedClubId],
    queryFn: () => presidentService.getClubDetail(selectedClubId),
    enabled: Boolean(selectedClubId),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['president-members', selectedClubId, 'settings'],
    queryFn: () => presidentService.listMembers(selectedClubId, { status: 'ACTIVE' }),
    enabled: Boolean(selectedClubId),
  });

  useEffect(() => {
    if (clubDetail) {
      setName(clubDetail.name);
      setShortDescription(clubDetail.shortDescription);
      setCategory(clubDetail.category);
      setLogo(
        clubDetail.logo ||
          `${CLUB_AVATAR_PREFIX}${getClubAvatarByValue(clubDetail.logo, clubDetail.slug).id}`
      );
      setAccentColor(clubDetail.accentColor || '#e6f3fe');
      setIsRecruiting(clubDetail.isRecruiting);
      setRequireVerification(clubDetail.requireVerification ?? true);
      if (clubDetail.contributionPointsConfig) {
        setPointsConfig({
          ...DEFAULT_POINTS,
          ...(clubDetail.contributionPointsConfig as Record<ContributionType, number>),
        });
      } else {
        setPointsConfig(DEFAULT_POINTS);
      }
    }
  }, [clubDetail]);

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      presidentService.updateSettings(selectedClubId, payload),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['president-club-detail', selectedClubId] });
      queryClient.invalidateQueries({ queryKey: ['president-clubs'] });
      queryClient.invalidateQueries({ queryKey: ['president-dashboard', selectedClubId] });
      queryClient.invalidateQueries({ queryKey: ['president-members', selectedClubId] });
      await refreshSession();
      toast.success('Club settings updated');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Could not update club settings'));
    },
  });

  const leaders = members.filter((m) => m.role !== 'MEMBER');
  const transferableMembers = members.filter((m) => m.role !== 'PRESIDENT');
  const isPresidentOrAdmin = selectedClub?.myRole === 'PRESIDENT';

  return (
    <PresidentLayout>
      <div>
        <p className="text-[13px] font-medium text-[#757575]">
          {selectedClub?.name} · Administration & Governance
        </p>
        <h1 className="mt-1 text-[32px] font-bold text-black tracking-[-0.03em]">
          Club Settings
        </h1>
        <p className="mt-1 text-[15px] text-[#615d59]">
          Configure club profile details, recruitment open status, contribution point weights, and presidency governance.
        </p>
      </div>

      {isLoading ? (
        <PageSkeleton />
      ) : isError ? (
        <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />
      ) : (
        <div className="space-y-6">
          {/* General */}
          <section className="notion-card p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-black">General Information</h2>
            <ClubAvatarPicker
              clubSlug={clubDetail?.slug || 'club'}
              selectedLogo={logo}
              selectedTint={accentColor}
              onSelectLogo={setLogo}
              onSelectTint={setAccentColor}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-black mb-1">Club Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 rounded-[8px] border border-black/[0.12] text-[14px]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-black mb-1">Category</label>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-[8px] border border-black/[0.12] text-[14px]"
                />
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-black mb-1">
                Short Summary
              </label>
              <input
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full h-10 px-3 rounded-[8px] border border-black/[0.12] text-[14px]"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-black/[0.06]">
              <label className="flex items-center gap-2.5 text-[14px] text-black cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecruiting}
                  onChange={(e) => setIsRecruiting(e.target.checked)}
                  className="w-4 h-4 accent-[#0075de]"
                />
                Club is actively accepting recruitment & join requests
              </label>
              <Button
                variant="primary"
                size="sm"
                disabled={saveMutation.isPending}
                onClick={() =>
                  saveMutation.mutate({
                    name,
                    category,
                    shortDescription,
                    logo: logo.trim() || null,
                    accentColor,
                    isRecruiting,
                  })
                }
              >
                <Save className="w-4 h-4" />
                Save General Settings
              </Button>
            </div>
          </section>

          {/* Leadership List */}
          <section className="notion-card p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-black flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0075de]" />
              Current Club Leadership ({leaders.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {leaders.map((leader) => (
                <div
                  key={leader.id}
                  className="p-3.5 rounded-[10px] border border-black/[0.08] bg-[#faf9f8] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-black truncate">
                      {leader.user.fullName}
                    </div>
                    <div className="text-[12px] text-[#757575] truncate">{leader.user.email}</div>
                  </div>
                  <Badge variant={leader.role === 'PRESIDENT' ? 'blue' : 'peach'}>
                    {leader.role.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </section>

          {/* Contribution Settings */}
          <section className="notion-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-[18px] font-bold text-black flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#ffb110]" />
                  Contribution Verification & Points Policy
                </h2>
                <p className="text-[13px] text-[#615d59]">
                  Default points awarded automatically when verifying a contribution without a manual override.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-[14px] text-black cursor-pointer">
              <input
                type="checkbox"
                checked={requireVerification}
                onChange={(e) => setRequireVerification(e.target.checked)}
                className="w-4 h-4 accent-[#0075de]"
              />
              Require leadership verification before awarding contribution points
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {CONTRIBUTION_TYPES.map((type) => (
                <div key={type} className="p-3 rounded-[10px] border border-black/[0.08] bg-[#faf9f8]">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#757575] mb-1">
                    {type}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={500}
                    value={pointsConfig[type]}
                    onChange={(e) =>
                      setPointsConfig((prev) => ({ ...prev, [type]: Number(e.target.value) }))
                    }
                    className="w-full h-9 px-2.5 rounded-[6px] border border-black/[0.12] bg-white text-[14px]"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button
                variant="primary"
                size="sm"
                disabled={saveMutation.isPending}
                onClick={() =>
                  saveMutation.mutate({
                    requireVerification,
                    contributionPointsConfig: pointsConfig,
                  })
                }
              >
                <Save className="w-4 h-4" />
                Save Points Policy
              </Button>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="notion-card p-6 border-[#f64932]/30 space-y-5">
            <div>
              <h2 className="text-[18px] font-bold text-[#f64932] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Governance & Danger Zone
              </h2>
              <p className="text-[13px] text-[#615d59]">
                Presidency transfers and club archiving take effect immediately in PostgreSQL.
              </p>
            </div>

            <div className="p-4 rounded-[10px] bg-[#faf9f8] border border-black/[0.08] flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div className="flex-1">
                <div className="text-[14px] font-semibold text-black flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#0075de]" />
                  Transfer Presidency
                </div>
                <p className="text-[12px] text-[#615d59] mt-0.5 mb-2">
                  Promotes the selected active member to PRESIDENT and updates the current president to VICE_PRESIDENT.
                </p>
                <select
                  value={transferTargetUserId}
                  onChange={(e) => setTransferTargetUserId(e.target.value)}
                  className="w-full max-w-sm h-10 px-3 rounded-[8px] border border-black/[0.12] bg-white text-[14px]"
                >
                  <option value="">Select active member...</option>
                  {transferableMembers.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user.fullName} ({m.role})
                    </option>
                  ))}
                </select>
              </div>
              <Button
                variant="secondary"
                size="sm"
                disabled={!transferTargetUserId || saveMutation.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      'Transfer club presidency to this member? Your role will become Vice President.'
                    )
                  ) {
                    saveMutation.mutate({ transferPresidentToUserId: transferTargetUserId });
                  }
                }}
              >
                Transfer Presidency
              </Button>
            </div>

            <div className="p-4 rounded-[10px] bg-[#f64932]/5 border border-[#f64932]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-[14px] font-semibold text-black">
                  {clubDetail?.isActive ? 'Archive Club' : 'Restore Archived Club'}
                </div>
                <p className="text-[12px] text-[#615d59]">
                  {isPresidentOrAdmin
                    ? 'Archiving marks the club inactive and hides it from new recruitment.'
                    : 'Only the Club President or Super Admin may archive this club.'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={saveMutation.isPending || !clubDetail?.isActive}
                onClick={() => {
                  if (
                    window.confirm(
                      'Archive this club? Members will keep history, but recruitment closes.'
                    )
                  ) {
                    saveMutation.mutate({ archiveClub: true });
                  }
                }}
              >
                {clubDetail?.isActive ? 'Archive Club' : 'Archived'}
              </Button>
            </div>
          </section>
        </div>
      )}
    </PresidentLayout>
  );
};
