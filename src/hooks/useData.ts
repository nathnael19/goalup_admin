import { useQuery } from "@tanstack/react-query";
import { competitionService } from "../services/competitionService";
import { tournamentService } from "../services/tournamentService";
import { teamService } from "../services/teamService";
import { matchService } from "../services/matchService";
import { playerService } from "../services/playerService";
import { newsService } from "../services/newsService";

export const queryKeys = {
  competitions: ["competitions"] as const,
  tournaments: ["tournaments"] as const,
  teams: ["teams"] as const,
  matches: ["matches"] as const,
  players: ["players"] as const,
  news: ["news"] as const,
  teamDetail: (id: string) => ["team", id] as const,
  matchDetail: (id: string) => ["match", id] as const,
};

export const useCompetitions = () => {
  return useQuery({
    queryKey: queryKeys.competitions,
    queryFn: () => competitionService.getAll(),
  });
};

export const useTournaments = () => {
  return useQuery({
    queryKey: queryKeys.tournaments,
    queryFn: () => tournamentService.getAll(),
  });
};

export const useTeams = () => {
  return useQuery({
    queryKey: queryKeys.teams,
    queryFn: () => teamService.getAll(),
  });
};

export const useMatches = () => {
  return useQuery({
    queryKey: queryKeys.matches,
    queryFn: () => matchService.getAll(),
  });
};

export const usePlayers = () => {
  return useQuery({
    queryKey: queryKeys.players,
    queryFn: () => playerService.getAll(),
  });
};

export const useNews = () => {
  return useQuery({
    queryKey: queryKeys.news,
    queryFn: () => newsService.getAll(),
  });
};

export const useTeamDetail = (id: string) => {
  return useQuery({
    queryKey: queryKeys.teamDetail(id),
    queryFn: () => teamService.getById(id),
    enabled: !!id,
  });
};

export const useMatchDetail = (id: string) => {
  return useQuery({
    queryKey: queryKeys.matchDetail(id),
    queryFn: () => matchService.getById(id),
    enabled: !!id,
  });
};
