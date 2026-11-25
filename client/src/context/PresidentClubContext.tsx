import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { PresidentAuthorizedClub, presidentService } from '../services/president.service';

interface PresidentClubContextValue {
  authorizedClubs: PresidentAuthorizedClub[];
  selectedClubId: string;
  selectedClub: PresidentAuthorizedClub | null;
  setSelectedClubId: (id: string) => void;
  isLoadingClubs: boolean;
}

const PresidentClubContext = createContext<PresidentClubContextValue | null>(null);

export const PresidentClubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, hasAnyLeadership } = useAuth();
  const [selectedClubId, setSelectedClubIdState] = useState<string>('');

  const { data: authorizedClubs = [], isLoading } = useQuery({
    queryKey: ['president-clubs'],
    queryFn: presidentService.listAuthorizedClubs,
    enabled: isAuthenticated && hasAnyLeadership,
  });

  useEffect(() => {
    if (authorizedClubs.length > 0) {
      const stillValid = authorizedClubs.some((c) => c.id === selectedClubId);
      if (!stillValid) {
        setSelectedClubIdState(authorizedClubs[0].id);
      }
    }
  }, [authorizedClubs, selectedClubId]);

  const setSelectedClubId = (id: string) => {
    setSelectedClubIdState(id);
  };

  const selectedClub =
    authorizedClubs.find((c) => c.id === selectedClubId) || authorizedClubs[0] || null;

  return (
    <PresidentClubContext.Provider
      value={{
        authorizedClubs,
        selectedClubId: selectedClub?.id || '',
        selectedClub,
        setSelectedClubId,
        isLoadingClubs: isLoading,
      }}
    >
      {children}
    </PresidentClubContext.Provider>
  );
};

export function usePresidentClub() {
  const ctx = useContext(PresidentClubContext);
  if (!ctx) {
    throw new Error('usePresidentClub must be used inside PresidentClubProvider');
  }
  return ctx;
}
