// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  detail: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
}

// Tournament Types
export interface Tournament {
  id: number;
  name: string;
  year: number;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTournamentDto {
  name: string;
  year: number;
  type: string;
}

// Team Types
export interface Team {
  id: number;
  name: string;
  batch: string;
  year: number;
  tournament_id: number;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTeamDto {
  name: string;
  batch: string;
  year: number;
  tournament_id: number;
}

// Player Types
export interface Player {
  id: number;
  name: string;
  team_id: number;
  jersey_number: number;
  position: string;
  goals: number;
  yellow_cards: number;
  red_cards: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePlayerDto {
  name: string;
  team_id: number;
  jersey_number: number;
  position: string;
}

export interface UpdatePlayerStatsDto {
  goals?: number;
  yellow_cards?: number;
  red_cards?: number;
}

// Match Types
export type MatchStatus = "scheduled" | "live" | "finished";

export interface Match {
  id: number;
  tournament_id: number;
  team_a_id: number;
  team_b_id: number;
  team_a_score: number;
  team_b_score: number;
  status: MatchStatus;
  match_time: string;
  created_at: string;
  updated_at: string;
  team_a?: Team;
  team_b?: Team;
}

export interface CreateMatchDto {
  tournament_id: number;
  team_a_id: number;
  team_b_id: number;
  match_time: string;
}

export interface UpdateMatchScoreDto {
  team_a_score?: number;
  team_b_score?: number;
  status?: MatchStatus;
}

// Standings Types
export interface Standing {
  team_id: number;
  team_name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}
