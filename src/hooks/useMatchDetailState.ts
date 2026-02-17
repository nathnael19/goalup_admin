import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { matchService } from "../services/matchService";
import { goalService } from "../services/goalService";
import { cardService } from "../services/cardService";
import { substitutionService } from "../services/substitutionService";
import { teamService } from "../services/teamService";
import { lineupService } from "../services/lineupService";
import type {
  TeamDetail,
  UpdateMatchScoreDto,
  CreateGoalDto,
  CreateCardDto,
  CreateSubstitutionDto,
} from "../types";

export const useMatchDetailState = (matchId: string | undefined) => {
  const queryClient = useQueryClient();
  const [tick, setTick] = useState(0);

  // Queries
  const { data: match, isLoading: loadingMatch } = useQuery({
    queryKey: ["match", matchId],
    queryFn: () => matchService.getById(matchId!),
    enabled: !!matchId,
  });

  const { data: goals = [], isLoading: loadingGoals } = useQuery({
    queryKey: ["goals", matchId],
    queryFn: () => goalService.getByMatchId(matchId!),
    enabled: !!matchId,
  });

  const { data: cards = [], isLoading: loadingCards } = useQuery({
    queryKey: ["cards", matchId],
    queryFn: () => cardService.getByMatchId(matchId!),
    enabled: !!matchId,
  });

  const { data: substitutions = [], isLoading: loadingSubs } = useQuery({
    queryKey: ["substitutions", matchId],
    queryFn: () => substitutionService.getByMatchId(matchId!),
    enabled: !!matchId,
  });

  const { data: teamADetail, isLoading: loadingTeamA } = useQuery({
    queryKey: ["team", match?.team_a_id],
    queryFn: () => teamService.getById(match!.team_a_id),
    enabled: !!match?.team_a_id,
  });

  const { data: teamBDetail, isLoading: loadingTeamB } = useQuery({
    queryKey: ["team", match?.team_b_id],
    queryFn: () => teamService.getById(match!.team_b_id),
    enabled: !!match?.team_b_id,
  });

  // Other leg match for knockouts
  const { data: otherLegMatch } = useQuery({
    queryKey: ["match", "otherLeg", matchId],
    queryFn: async () => {
      if (!match?.stage || match.tournament?.knockout_legs !== 2) return null;
      const allMatches = await matchService.getAll({
        tournament_id: match.tournament_id,
      });
      return (
        allMatches.find(
          (m) =>
            m.id !== matchId &&
            m.stage === match.stage &&
            ((m.team_a_id === match.team_a_id &&
              m.team_b_id === match.team_b_id) ||
              (m.team_a_id === match.team_b_id &&
                m.team_b_id === match.team_a_id)),
        ) || null
      );
    },
    enabled: !!match?.stage && match?.tournament?.knockout_legs === 2,
  });

  // Ticking for live match time
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Mutations
  const updateMatchMutation = useMutation({
    mutationFn: (data: UpdateMatchScoreDto) => {
      if (match?.status === "finished")
        return Promise.reject("Match is locked");
      return matchService.update(matchId!, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match", matchId] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });

  const addGoalMutation = useMutation({
    mutationFn: (data: Omit<CreateGoalDto, "match_id">) => {
      if (match?.status === "finished")
        return Promise.reject("Match is locked");
      return goalService.create({ ...data, match_id: matchId! });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", matchId] });
      queryClient.invalidateQueries({ queryKey: ["match", matchId] });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id: string) => {
      if (match?.status === "finished")
        return Promise.reject("Match is locked");
      return goalService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", matchId] });
      queryClient.invalidateQueries({ queryKey: ["match", matchId] });
    },
  });

  const addCardMutation = useMutation({
    mutationFn: (data: Omit<CreateCardDto, "match_id">) => {
      if (match?.status === "finished")
        return Promise.reject("Match is locked");
      return cardService.create({ ...data, match_id: matchId! });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", matchId] });
      queryClient.invalidateQueries({ queryKey: ["match", matchId] });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: (id: string) => {
      if (match?.status === "finished")
        return Promise.reject("Match is locked");
      return cardService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", matchId] });
      queryClient.invalidateQueries({ queryKey: ["match", matchId] });
    },
  });

  const addSubMutation = useMutation({
    mutationFn: (data: Omit<CreateSubstitutionDto, "match_id">) => {
      if (match?.status === "finished")
        return Promise.reject("Match is locked");
      return substitutionService.create({ ...data, match_id: matchId! });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["substitutions", matchId] });
      queryClient.invalidateQueries({ queryKey: ["match", matchId] });
    },
  });

  const deleteSubMutation = useMutation({
    mutationFn: (id: string) => {
      if (match?.status === "finished")
        return Promise.reject("Match is locked");
      return substitutionService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["substitutions", matchId] });
      queryClient.invalidateQueries({ queryKey: ["match", matchId] });
    },
  });

  const deleteMatchMutation = useMutation({
    mutationFn: (id: string) => {
      if (match?.status === "finished")
        return Promise.reject("Match is locked");
      return matchService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });

  const saveLineupsMutation = useMutation({
    mutationFn: async ({
      lineupsA,
      lineupsB,
      benchA,
      benchB,
      formationA,
      formationB,
    }: {
      lineupsA: Record<number, string>;
      lineupsB: Record<number, string>;
      benchA: string[];
      benchB: string[];
      formationA: string;
      formationB: string;
    }) => {
      if (match?.status === "finished")
        return Promise.reject("Match is locked");
      const lineupPayloadA = [
        ...Object.entries(lineupsA).map(([slot, pid]) => ({
          match_id: matchId!,
          team_id: match!.team_a_id,
          player_id: pid,
          is_starting: true,
          slot_index: parseInt(slot),
        })),
        ...benchA.map((pid) => ({
          match_id: matchId!,
          team_id: match!.team_a_id,
          player_id: pid,
          is_starting: false,
        })),
      ];

      const lineupPayloadB = [
        ...Object.entries(lineupsB).map(([slot, pid]) => ({
          match_id: matchId!,
          team_id: match!.team_b_id,
          player_id: pid,
          is_starting: true,
          slot_index: parseInt(slot),
        })),
        ...benchB.map((pid) => ({
          match_id: matchId!,
          team_id: match!.team_b_id,
          player_id: pid,
          is_starting: false,
        })),
      ];

      await lineupService.setLineups(
        matchId!,
        [...lineupPayloadA, ...lineupPayloadB],
        {
          formation_a: formationA,
          formation_b: formationB,
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match", matchId] });
    },
  });

  const calculateMatchTimeDisplay = useCallback(() => {
    if (!match || match.status !== "live") return null;
    if (match.is_halftime) return "HT";

    let start: Date;
    let offset = 0;

    if (match.second_half_start) {
      start = new Date(match.second_half_start);
      offset = 45;
    } else if (match.first_half_start) {
      start = new Date(match.first_half_start);
    } else {
      return "0'";
    }

    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    let diffMins = Math.floor(diffMs / 60000) + offset;

    if (
      !match.second_half_start &&
      diffMins > 45 + (match.additional_time_first_half || 0)
    ) {
      return "45+";
    }
    if (
      match.second_half_start &&
      diffMins > 90 + (match.additional_time_second_half || 0)
    ) {
      return "90+";
    }

    return `${diffMins}'`;
  }, [match, tick]);

  const isLoading =
    loadingMatch ||
    loadingGoals ||
    loadingCards ||
    loadingSubs ||
    loadingTeamA ||
    loadingTeamB;

  return {
    match,
    goals,
    cards,
    substitutions,
    teamADetail: teamADetail as TeamDetail | undefined,
    teamBDetail: teamBDetail as TeamDetail | undefined,
    otherLegMatch,
    tick,
    calculateMatchTime: calculateMatchTimeDisplay,
    isLoading,
    mutations: {
      updateMatch: updateMatchMutation.mutateAsync,
      addGoal: addGoalMutation.mutateAsync,
      deleteGoal: deleteGoalMutation.mutateAsync,
      addCard: addCardMutation.mutateAsync,
      deleteCard: deleteCardMutation.mutateAsync,
      addSub: addSubMutation.mutateAsync,
      deleteSub: deleteSubMutation.mutateAsync,
      deleteMatch: deleteMatchMutation.mutateAsync,
      saveLineups: saveLineupsMutation.mutateAsync,
      isSavingLineups: saveLineupsMutation.isPending,
    },
  };
};
