// User and Authentication Types
export interface User {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Team and Role Types
export type UserRole = 'super_admin' | 'team_admin' | 'member';

export interface Team {
  id: string;
  name: string;
  description?: string;
  invitationCode: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: UserRole;
  joinedAt: string;
  isActive: boolean;
  user?: User;
}

export interface UserTeam extends Team {
  userRole: UserRole;
  memberCount?: number;
}

// Musical Types
export interface MusicalRole {
  id: string;
  name: string;
  createdAt: string;
}

export interface Song {
  id: string;
  title: string;
  artist?: string;
  genre?: string;
  duration?: number; // in seconds
  keySignature?: string;
  tempo?: number;
  lyrics?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
  files?: SongFile[];
}

export interface SongFile {
  id: string;
  songId: string;
  fileName: string;
  fileUrl: string;
  fileType: 'sheet_music' | 'audio' | 'other';
  fileSize?: number;
  uploadedBy: string;
  createdAt: string;
}

// Assignment Types
export interface Assignment {
  id: string;
  teamId: string;
  title: string;
  description?: string;
  assignmentDate: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  location?: string;
  isRecurring: boolean;
  recurrencePattern?: string; // JSON string
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members?: AssignmentMember[];
  songs?: AssignmentSong[];
}

export interface AssignmentMember {
  id: string;
  assignmentId: string;
  userId: string;
  musicalRoleId: string;
  createdAt: string;
  user?: User;
  musicalRole?: MusicalRole;
}

export interface AssignmentSong {
  id: string;
  assignmentId: string;
  songId: string;
  orderIndex: number;
  notes?: string;
  createdAt: string;
  song?: Song;
}

// Presence Types
export type PresenceStatus = 'present' | 'absent' | 'late';

export interface PresenceDeclaration {
  id: string;
  assignmentId: string;
  userId: string;
  status: PresenceStatus;
  justification?: string;
  declaredAt: string;
  adminOverride: boolean;
  adminOverrideBy?: string;
  adminOverrideAt?: string;
  user?: User;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  teamId?: string;
  type: string;
  title: string;
  message: string;
  data?: string; // JSON string
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  notificationType: string;
  inApp: boolean;
  email: boolean;
  whatsapp: boolean;
  createdAt: string;
  updatedAt: string;
}

// UI State Types
export interface TeamContextState {
  selectedTeam: UserTeam | null;
  userRole: UserRole | null;
  isLoading: boolean;
}

// Form Types
export interface CreateTeamForm {
  name: string;
  description?: string;
}

export interface JoinTeamForm {
  invitationCode: string;
}

export interface CreateAssignmentForm {
  title: string;
  description?: string;
  assignmentDate: string;
  startTime: string;
  endTime: string;
  location?: string;
  isRecurring: boolean;
  recurrencePattern?: string;
  selectedMembers: Array<{
    userId: string;
    musicalRoleId: string;
  }>;
  selectedSongs: string[];
}

export interface CreateSongForm {
  title: string;
  artist?: string;
  genre?: string;
  duration?: number;
  keySignature?: string;
  tempo?: number;
  lyrics?: string;
  notes?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}