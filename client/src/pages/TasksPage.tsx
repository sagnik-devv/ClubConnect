import React, { useState } from 'react';
import { WorkspaceLayout } from '../layouts/WorkspaceLayout';
import { KanbanBoard } from '../components/tasks/KanbanBoard';
import { useAuth } from '../context/AuthContext';

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedClub, setSelectedClub] = useState<string>('All');
  const activeClubs = (user?.memberships ?? []).filter((m) => m.status === 'ACTIVE');

  return (
    <WorkspaceLayout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[13px] font-medium text-[#757575]">Shared Task Board</p>
          <h1 className="mt-1 text-[32px] sm:text-[42px] font-bold text-black tracking-[-0.035em] leading-tight">
            Make progress together.
          </h1>
          <p className="mt-2 text-[15px] text-[#615d59] font-editorial">
            Track assigned responsibilities across your clubs with real-time PostgreSQL persistence.
          </p>
        </div>

        <div>
          <select
            aria-label="Filter tasks by club"
            value={selectedClub}
            onChange={(e) => setSelectedClub(e.target.value)}
            className="px-3.5 py-2 rounded-[8px] border border-black/15 bg-white text-[14px] font-medium"
          >
            <option value="All">All My Clubs</option>
            {activeClubs.map((m) => (
              <option key={m.clubId} value={m.clubId}>
                {m.club.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <KanbanBoard clubFilterId={selectedClub} />
    </WorkspaceLayout>
  );
};
