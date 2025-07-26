import React from 'react';
import { UserTeam, TeamContextState } from '../types';

export const TeamContext = React.createContext<{
  teamState: TeamContextState;
  setSelectedTeam: (team: UserTeam | null) => void;
  refreshTeams: () => Promise<void>;
}>({
  teamState: { selectedTeam: null, userRole: null, isLoading: false },
  setSelectedTeam: () => {},
  refreshTeams: async () => {},
});