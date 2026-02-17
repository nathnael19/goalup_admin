import React, { useState, useEffect } from "react";
import { type Match, type Team } from "../../types";
import { matchService } from "../../services/matchService";
import { teamService } from "../../services/teamService";
import { StandingsTable } from "./StandingsTable";

interface SeasonStandingsProps {
  seasonId: string;
  initialMatches?: Match[];
  initialTeams?: Team[];
}

export const SeasonStandings: React.FC<SeasonStandingsProps> = ({
  seasonId,
  initialMatches,
  initialTeams,
}) => {
  const [loading, setLoading] = useState(!initialMatches || !initialTeams);
  const [matches, setMatches] = useState<Match[]>(initialMatches || []);
  const [teams, setTeams] = useState<Team[]>(initialTeams || []);

  const fetchData = async () => {
    // If we have both matches and teams passed as props, don't fetch
    if (initialMatches && initialTeams) return;

    try {
      setLoading(true);
      const [matchesData, teamsData] = await Promise.all([
        matchService.getAll({ tournament_id: seasonId }),
        teamService.getAll(),
      ]);
      setMatches(matchesData);
      setTeams(teamsData.filter((t) => t.tournament_id === seasonId));
    } catch (err) {
      console.error("Failed to fetch standings data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialMatches && initialTeams) {
      setMatches(initialMatches);
      setTeams(initialTeams);
      setLoading(false);
      return;
    }
    if (seasonId) {
      fetchData();
    }
  }, [seasonId, initialMatches, initialTeams]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <StandingsTable matches={matches} teams={teams} />;
};
