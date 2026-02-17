import React from "react";
import { type Match, type Team, type Standing } from "../../types";
import { getFullImageUrl } from "../../utils/url";
import { FiAward } from "react-icons/fi";

interface StandingsTableProps {
  matches: Match[];
  teams: Team[];
}

export const StandingsTable: React.FC<StandingsTableProps> = ({
  matches,
  teams,
}) => {
  const standings: Standing[] = teams.map((team) => {
    const stats: Standing = {
      team_id: team.id,
      tournament_id: team.tournament_id,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goals_for: 0,
      goals_against: 0,
      points: 0,
      team: team,
    };

    const teamMatches = matches.filter(
      (m) =>
        m.status === "finished" &&
        (m.team_a_id === team.id || m.team_b_id === team.id),
    );

    teamMatches.forEach((m) => {
      stats.played++;
      const isTeamA = m.team_a_id === team.id;
      const goalsFor = isTeamA ? m.score_a : m.score_b;
      const goalsAgainst = isTeamA ? m.score_b : m.score_a;

      stats.goals_for += goalsFor;
      stats.goals_against += goalsAgainst;

      if (goalsFor > goalsAgainst) {
        stats.won++;
        stats.points += 3;
      } else if (goalsFor === goalsAgainst) {
        stats.drawn++;
        stats.points += 1;
      } else {
        stats.lost++;
      }
    });

    return stats;
  });

  const sortedStandings = [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goals_for - a.goals_against;
    const gdB = b.goals_for - b.goals_against;
    if (gdB !== gdA) return gdB - gdA;
    return b.goals_for - a.goals_for;
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-separate border-spacing-y-2">
        <thead>
          <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            <th className="px-6 py-4">Pos</th>
            <th className="px-6 py-4">Team</th>
            <th className="px-6 py-4 text-center">P</th>
            <th className="px-6 py-4 text-center">W</th>
            <th className="px-6 py-4 text-center">D</th>
            <th className="px-6 py-4 text-center">L</th>
            <th className="px-6 py-4 text-center">GF</th>
            <th className="px-6 py-4 text-center">GA</th>
            <th className="px-6 py-4 text-center">GD</th>
            <th className="px-6 py-4 text-center bg-blue-600/5 rounded-t-xl">
              PTS
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedStandings.map((s, i) => {
            const gd = s.goals_for - s.goals_against;
            return (
              <tr
                key={s.team_id}
                className="group card-hover-simple bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 hover:bg-slate-800/60 transition-all duration-300"
              >
                <td className="px-6 py-4">
                  <span
                    className={`text-sm font-black ${i < 3 ? "text-blue-400" : "text-slate-500"}`}
                  >
                    {i + 1}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700/50 overflow-hidden shrink-0">
                      {s.team?.logo_url ? (
                        <img
                          src={getFullImageUrl(s.team.logo_url)}
                          alt={s.team.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FiAward size={16} />
                      )}
                    </div>
                    <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate max-w-[150px]">
                      {s.team?.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center text-sm font-medium text-slate-300">
                  {s.played}
                </td>
                <td className="px-6 py-4 text-center text-sm font-medium text-slate-300">
                  {s.won}
                </td>
                <td className="px-6 py-4 text-center text-sm font-medium text-slate-300">
                  {s.drawn}
                </td>
                <td className="px-6 py-4 text-center text-sm font-medium text-slate-300">
                  {s.lost}
                </td>
                <td className="px-6 py-4 text-center text-sm font-medium text-slate-300">
                  {s.goals_for}
                </td>
                <td className="px-6 py-4 text-center text-sm font-medium text-slate-300">
                  {s.goals_against}
                </td>
                <td
                  className={`px-6 py-4 text-center text-sm font-bold ${gd > 0 ? "text-emerald-500" : gd < 0 ? "text-red-500" : "text-slate-500"}`}
                >
                  {gd > 0 ? `+${gd}` : gd}
                </td>
                <td className="px-6 py-4 text-center bg-blue-600/10 rounded-xl">
                  <span className="text-base font-black text-blue-400 font-display">
                    {s.points}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {sortedStandings.length === 0 && (
        <div className="py-20 text-center opacity-50 border border-dashed border-white/10 rounded-3xl mt-2">
          <p className="text-sm font-black uppercase tracking-widest text-slate-500">
            No Teams Assigned
          </p>
        </div>
      )}
    </div>
  );
};
