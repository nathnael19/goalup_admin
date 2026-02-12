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

export type UserRole =
  | "SUPER_ADMIN"
  | "TOURNAMENT_ADMIN"
  | "NEWS_REPORTER"
  | "COACH"
  | "REFEREE"
  | "VIEWER";

export const UserRoles = {
  SUPER_ADMIN: "SUPER_ADMIN" as UserRole,
  TOURNAMENT_ADMIN: "TOURNAMENT_ADMIN" as UserRole,
  NEWS_REPORTER: "NEWS_REPORTER" as UserRole,
  COACH: "COACH" as UserRole,
  REFEREE: "REFEREE" as UserRole,
  VIEWER: "VIEWER" as UserRole,
};

export interface User {
  id: string; // Backend uses int for ID in users.py but auth/me returns string? I'll use string to be safe as it matches existing code.
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  role: UserRole;
  team_id?: string;
  tournament_id?: string;
}

export interface UserCreateDto {
  email: string;
  full_name: string;
  password: string;
  role: UserRole;
  team_id?: string;
  tournament_id?: string;
}

export interface UserUpdateDto {
  email?: string;
  full_name?: string;
  password?: string;
  role?: UserRole;
  is_active?: boolean;
  team_id?: string;
  tournament_id?: string;
}

// Competition Types
export interface Competition {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCompetitionDto {
  name: string;
  description?: string;
  image_url?: string;
}

// Tournament Types
export interface Tournament {
  id: string;
  name: string;
  year: number;
  type: string;
  image_url?: string;
  competition_id?: string;
  competition?: Competition;
  knockout_legs: number;
  has_third_place_match: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTournamentDto {
  name: string;
  year: number;
  type: string;
  image_url?: string;
  competition_id?: string;
  knockout_legs?: number;
  has_third_place_match?: boolean;
}

// Team Types
export interface Team {
  id: string;
  name: string;
  tournament_id: string;
  logo_url?: string;
  color?: string;
  stadium?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTeamDto {
  name: string;
  tournament_id: string;
  logo_url?: string;
  color?: string;
  stadium?: string;
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
export type PlayerPosition =
  | "cb"
  | "cdm"
  | "cam"
  | "cm"
  | "st"
  | "lw"
  | "rw"
  | "rb"
  | "lb"
  | "gk";

export interface Player {
  id: string;
  name: string;
  team_id: string;
  jersey_number: number;
  position: PlayerPosition;
  image_url?: string;
  goals: number;
  yellow_cards: number;
  red_cards: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePlayerDto {
  position: PlayerPosition;
  image_url?: string;
}

export interface UpdatePlayerStatsDto {
  name?: string;
  team_id?: string;
  jersey_number?: number;
  position?: PlayerPosition;
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
  total_time?: number;
  is_halftime?: boolean;
  first_half_start?: string;
  second_half_start?: string;
  finished_at?: string;
  match_day: number;
  stage?: string;
  penalty_score_a?: number;
  penalty_score_b?: number;
  is_extra_time?: boolean;
  goals_list?: Goal[];
  cards_list?: CardEvent[];
  lineups?: Lineup[];
  formation_a: string;
  formation_b: string;
}

export type CardType = "yellow" | "red";

export interface CardEvent {
  id: string;
  match_id: string;
  player_id: string;
  team_id: string;
  minute: number;
  type: CardType;
  player?: Player;
}

export interface CreateCardDto {
  match_id: string;
  player_id: string;
  team_id: string;
  minute: number;
  type: CardType;
}

export interface Goal {
  id: string;
  match_id: string;
  player_id?: string;
  team_id: string;
  minute: number;
  is_own_goal: boolean;
  assistant_id?: string;
  player?: Player;
  assistant?: Player;
}

export interface CreateGoalDto {
  match_id: string;
  player_id?: string;
  assistant_id?: string;
  team_id: string;
  minute: number;
  is_own_goal: boolean;
}

export interface CreateMatchDto {
  tournament_id: string;
  team_a_id: string;
  team_b_id: string;
  start_time: string;
  total_time?: number;
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
  total_time?: number;
  is_halftime?: boolean;
  first_half_start?: string;
  second_half_start?: string;
  finished_at?: string;
  match_day?: number;
  stage?: string;
  penalty_score_a?: number;
  penalty_score_b?: number;
  is_extra_time?: boolean;
  formation_a?: string;
  formation_b?: string;
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

// Substitution Types
export interface Substitution {
  id: string;
  match_id: string;
  team_id: string;
  player_in_id: string;
  player_out_id: string;
  minute: number;
  created_at: string;
  player_in?: Player;
  player_out?: Player;
}

export interface CreateSubstitutionDto {
  match_id: string;
  team_id: string;
  player_in_id: string;
  player_out_id: string;
  minute: number;
}

// News Types
export type NewsCategory = "transfer" | "injury" | "general" | "match_report";

export interface News {
  id: string;
  title: string;
  content: string;
  category: NewsCategory;
  image_url?: string;
  team_id?: string;
  player_id?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  team?: Team;
  player?: Player;
}

export interface CreateNewsDto {
  title: string;
  content: string;
  category: NewsCategory;
  image_url?: string;
  team_id?: string;
  player_id?: string;
  is_published?: boolean;
}

export interface UpdateNewsDto {
  title?: string;
  content?: string;
  category?: NewsCategory;
  image_url?: string;
  team_id?: string;
  player_id?: string;
  is_published?: boolean;
}

// Lineup Types
export interface Lineup {
  id: string;
  match_id: string;
  team_id: string;
  player_id: string;
  is_starting: boolean;
  player?: Player;
  slot_index?: number;
}

export interface MatchLineupDto {
  match_id: string;
  team_id: string;
  player_id: string;
  is_starting: boolean;
  slot_index?: number;
}
