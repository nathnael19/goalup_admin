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
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
}

// Tournament Types
export interface Tournament {
  id: string;
  name: string;
  year: number;
  type: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTournamentDto {
  year: number;
  type: string;
  image_url?: string;
}

// Team Types
export interface Team {
  id: string;
  name: string;
  batch: string;
  tournament_id: string;
  logo_url?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTeamDto {
  name: string;
  batch: string;
  tournament_id: string;
  logo_url?: string;
  color?: string;
}

export interface TeamRoster {
  goalkeepers: Player[];
  defenders: Player[];
  midfielders: Player[];
  forwards: Player[];
}

export interface TeamDetail extends Team {
  roster: TeamRoster;
  standings: Standing[];
  matches: Match[];
}

// Player Types
export interface Player {
  id: string;
  name: string;
  team_id: string;
  jersey_number: number;
  position: string;
  image_url?: string;
  goals: number;
  yellow_cards: number;
  red_cards: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePlayerDto {
  position: string;
  image_url?: string;
}

export interface UpdatePlayerStatsDto {
  name?: string;
  team_id?: string;
  jersey_number?: number;
  position?: string;
  goals?: number;
  yellow_cards?: number;
  red_cards?: number;
}

// Match Types
export type MatchStatus = "scheduled" | "live" | "finished";

export interface Match {
  id: string;
  tournament_id: string;
  team_a_id: string;
  team_b_id: string;
  score_a: number;
  score_b: number;
  status: MatchStatus;
  start_time: string;
  created_at: string;
  updated_at: string;
  team_a?: Team;
  team_b?: Team;
  tournament?: Tournament;
  additional_time_first_half?: number;
  additional_time_second_half?: number;
}

export interface CreateMatchDto {
  tournament_id: string;
  team_a_id: string;
  team_b_id: string;
  start_time: string;
}

export interface UpdateMatchScoreDto {
  tournament_id?: string;
  team_a_id?: string;
  team_b_id?: string;
  score_a?: number;
  score_b?: number;
  status?: MatchStatus;
  start_time?: string;
  additional_time_first_half?: number;
  additional_time_second_half?: number;
}

// Standings Types
export interface Standing {
  team_id: string;
  tournament_id: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  points: number;
  team?: Team;
}
export interface GroupedStanding {
  tournament: Tournament;
  teams: Standing[];
}
