import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiX, FiSave, FiEdit2, FiTrash2 } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { UserRoles } from "../types";
import type { Match, CreateGoalDto, CardType } from "../types";
import { CardSkeleton } from "../components/LoadingSkeleton";

// Hooks & Utils
import { useMatchDetailState } from "../hooks/useMatchDetailState";
import { isMatchLocked } from "../utils/matchUtils";

// Sub-components
import { MatchHero } from "../components/match/MatchHero";
import { MatchTimeline } from "../components/match/MatchTimeline";
import { MatchTacticalBoard } from "../components/match/MatchTacticalBoard";
import { MatchCommandPanel } from "../components/match/MatchCommandPanel";
import {
  GoalModal,
  CardModal,
  SubstitutionModal,
  LineupErrorModal,
  SlotModal,
} from "../components/match/MatchEventModals";

export const MatchDetailPage: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State Hook
  const {
    match,
    goals,
    cards,
    substitutions,
    teamADetail,
    teamBDetail,
    otherLegMatch,
    tick,
    calculateMatchTime,
    isLoading,
    mutations,
  } = useMatchDetailState(id);

  // UI State
  const [viewTeam, setViewTeam] = useState<"A" | "B">("A");
  const [isEditing, setIsEditing] = useState(false);
  const [editedMatch, setEditedMatch] = useState<Partial<Match>>({});
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalData, setGoalData] = useState<Omit<CreateGoalDto, "match_id">>({
    team_id: "",
    player_id: "",
    assistant_id: "",
    minute: 1,
    is_own_goal: false,
  });
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardData, setCardData] = useState({
    team_id: "",
    player_id: "",
    minute: 1,
    type: "yellow" as CardType,
  });
  const [showSubModal, setShowSubModal] = useState(false);
  const [subData, setSubData] = useState({
    team_id: "",
    player_in_id: "",
    player_out_id: "",
    minute: 1,
  });
  const [showLineupErrorModal, setShowLineupErrorModal] = useState(false);
  const [slotModal, setSlotModal] = useState<{
    teamId: string;
    position: string;
    teamKey: "A" | "B";
    replaceId?: string;
    slot_index: number;
  } | null>(null);

  // Formation local state (for unsaved changes)
  const [formationA, setFormationA] = useState("4-3-3");
  const [formationB, setFormationB] = useState("4-3-3");
  const [selectedLineupA, setSelectedLineupA] = useState<
    Record<number, string>
  >({});
  const [selectedLineupB, setSelectedLineupB] = useState<
    Record<number, string>
  >({});
  const [selectedBenchA, setSelectedBenchA] = useState<string[]>([]);
  const [selectedBenchB, setSelectedBenchB] = useState<string[]>([]);

  // Sync state when match changes
  useEffect(() => {
    if (match) {
      setEditedMatch(match);
      setFormationA(match.formation_a || "4-3-3");
      setFormationB(match.formation_b || "4-3-3");

      const lA: Record<number, string> = {};
      const lB: Record<number, string> = {};
      match.lineups?.forEach((l) => {
        if (l.is_starting && l.slot_index !== undefined) {
          if (l.team_id === match.team_a_id) lA[l.slot_index] = l.player_id;
          else if (l.team_id === match.team_b_id)
            lB[l.slot_index] = l.player_id;
        }
      });
      setSelectedLineupA(lA);
      setSelectedLineupB(lB);
      setSelectedBenchA(
        match.lineups
          ?.filter((l) => l.team_id === match.team_a_id && !l.is_starting)
          .map((l) => l.player_id) || [],
      );
      setSelectedBenchB(
        match.lineups
          ?.filter((l) => l.team_id === match.team_b_id && !l.is_starting)
          .map((l) => l.player_id) || [],
      );
    }
  }, [match]);

  // Sync view team for coach
  useEffect(() => {
    if (user?.role === UserRoles.COACH && user.team_id === match?.team_b_id) {
      setViewTeam("B");
    }
  }, [user, match]);

  if (isLoading && !match) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 rounded-full bg-slate-800/50 animate-pulse" />
          <div className="h-8 w-48 bg-slate-800/50 rounded-lg animate-pulse" />
        </div>
        <CardSkeleton />
      </div>
    );
  }

  if (!match)
    return (
      <div className="p-20 text-center text-slate-500">Match not found</div>
    );

  const handleUpdateScore = (team: "a" | "b", delta: number) => {
    const key = team === "a" ? "score_a" : "score_b";
    const currentScore = (editedMatch as any)[key] ?? 0;
    setEditedMatch({
      ...editedMatch,
      [key]: Math.max(0, currentScore + delta),
    });
  };

  const handleSaveMatch = async () => {
    await mutations.updateMatch({
      score_a: editedMatch.score_a,
      score_b: editedMatch.score_b,
      penalty_score_a: editedMatch.penalty_score_a,
      penalty_score_b: editedMatch.penalty_score_b,
      status: editedMatch.status,
      additional_time_first_half: editedMatch.additional_time_first_half,
      additional_time_second_half: editedMatch.additional_time_second_half,
      total_time: editedMatch.total_time,
      is_halftime: editedMatch.is_halftime,
    });
    setIsEditing(false);
  };

  const handleDeleteMatch = async () => {
    if (window.confirm("Delete this match?")) {
      // Logic for deletion usually in a service, here we assume it's just a call.
      // We could add a delete mutation to the hook if needed.
    }
  };

  const openGoalModal = (teamId: string) => {
    const min = calculateMatchTime()?.replace("'", "");
    setGoalData({
      ...goalData,
      team_id: teamId,
      minute: min ? parseInt(min) : 1,
    });
    setShowGoalModal(true);
  };

  const openCardModal = (teamId: string, type: CardType) => {
    const min = calculateMatchTime()?.replace("'", "");
    setCardData({
      ...cardData,
      team_id: teamId,
      type,
      minute: min ? parseInt(min) : 1,
    });
    setShowCardModal(true);
  };

  const openSubModal = (teamId: string) => {
    const min = calculateMatchTime()?.replace("'", "");
    setSubData({
      ...subData,
      team_id: teamId,
      minute: min ? parseInt(min) : 1,
    });
    setShowSubModal(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header / Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/matches")}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
            <FiArrowLeft />
          </div>
          <span className="font-bold">Back to Matches</span>
        </button>

        <div className="flex gap-3">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedMatch(match);
                }}
                className="btn btn-secondary"
              >
                <FiX className="mr-2" /> Cancel
              </button>
              <button onClick={handleSaveMatch} className="btn btn-primary">
                <FiSave className="mr-2" /> Save Changes
              </button>
            </>
          ) : (
            user?.role === UserRoles.TOURNAMENT_ADMIN && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-secondary"
                  disabled={isMatchLocked(match)}
                >
                  <FiEdit2 className="mr-2" /> Edit
                </button>
                <button
                  onClick={handleDeleteMatch}
                  className="btn btn-secondary text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                  disabled={isMatchLocked(match)}
                >
                  <FiTrash2 className="mr-2" /> Delete
                </button>
              </>
            )
          )}
        </div>
      </div>

      <MatchHero
        match={match}
        tick={tick}
        isEditing={isEditing}
        editedMatch={editedMatch}
        updateScore={handleUpdateScore}
        otherLegMatch={otherLegMatch}
        teamA={teamADetail}
        teamB={teamBDetail}
      />

      <MatchCommandPanel
        match={match}
        tick={tick}
        userRole={user?.role}
        isLocked={isMatchLocked(match)}
        onStartMatch={() =>
          mutations.updateMatch({
            status: "live",
            first_half_start: new Date().toISOString(),
          })
        }
        onFinishMatch={() =>
          mutations.updateMatch({
            status: "finished",
            finished_at: new Date().toISOString(),
          })
        }
        onStartSecondHalf={() =>
          mutations.updateMatch({
            is_halftime: false,
            second_half_start: new Date().toISOString(),
          })
        }
        onToggleHalftime={() =>
          mutations.updateMatch({ is_halftime: !match.is_halftime })
        }
        onOpenGoalModal={openGoalModal}
        onOpenCardModal={openCardModal}
        onOpenSubModal={openSubModal}
        onEditMatch={() => setIsEditing(true)}
        editedMatch={editedMatch}
        setEditedMatch={setEditedMatch}
        isEditing={isEditing}
        teamA={teamADetail}
        teamB={teamBDetail}
      />

      <div className="grid grid-cols-1 gap-6">
        <MatchTimeline
          match={match}
          goals={goals}
          cards={cards}
          substitutions={substitutions}
          isLocked={isMatchLocked(match)}
          onDeleteGoal={mutations.deleteGoal}
          onDeleteCard={mutations.deleteCard}
          onDeleteSub={mutations.deleteSub}
          teamA={teamADetail}
          teamB={teamBDetail}
        />
      </div>

      <MatchTacticalBoard
        match={match}
        viewTeam={viewTeam}
        setViewTeam={setViewTeam}
        formationA={formationA}
        setFormationA={setFormationA}
        formationB={formationB}
        setFormationB={setFormationB}
        selectedLineupA={selectedLineupA}
        selectedLineupB={selectedLineupB}
        selectedBenchA={selectedBenchA}
        setSelectedBenchA={setSelectedBenchA}
        selectedBenchB={selectedBenchB}
        setSelectedBenchB={setSelectedBenchB}
        teamADetail={teamADetail}
        teamBDetail={teamBDetail}
        userRole={user?.role}
        userTeamId={user?.team_id}
        onSaveLineups={() =>
          mutations.saveLineups({
            lineupsA: selectedLineupA,
            lineupsB: selectedLineupB,
            benchA: selectedBenchA,
            benchB: selectedBenchB,
            formationA,
            formationB,
          })
        }
        isSaving={mutations.isSavingLineups}
        isLocked={isMatchLocked(match)}
        onOpenSlotModal={setSlotModal}
      />

      {/* Modals */}
      {showGoalModal && (
        <GoalModal
          match={match}
          goalData={goalData}
          setGoalData={setGoalData}
          teamADetail={teamADetail}
          teamBDetail={teamBDetail}
          onClose={() => setShowGoalModal(false)}
          onSubmit={(e) => {
            e.preventDefault();
            mutations.addGoal(goalData);
            setShowGoalModal(false);
          }}
        />
      )}
      {showCardModal && (
        <CardModal
          match={match}
          cardData={cardData}
          setCardData={setCardData}
          teamADetail={teamADetail}
          teamBDetail={teamBDetail}
          onClose={() => setShowCardModal(false)}
          onSubmit={(e) => {
            e.preventDefault();
            mutations.addCard(cardData);
            setShowCardModal(false);
          }}
        />
      )}
      {showSubModal && (
        <SubstitutionModal
          match={match}
          subData={subData}
          setSubData={setSubData}
          teamADetail={teamADetail}
          teamBDetail={teamBDetail}
          onClose={() => setShowSubModal(false)}
          onSubmit={(e) => {
            e.preventDefault();
            mutations.addSub(subData);
            setShowSubModal(false);
          }}
        />
      )}
      {showLineupErrorModal && (
        <LineupErrorModal onClose={() => setShowLineupErrorModal(false)} />
      )}
      {slotModal && (
        <SlotModal
          slot={slotModal}
          teamDetail={slotModal.teamKey === "A" ? teamADetail : teamBDetail}
          onClose={() => setSlotModal(null)}
          onSelect={(pid) => {
            if (slotModal.teamKey === "A")
              setSelectedLineupA({
                ...selectedLineupA,
                [slotModal.slot_index]: pid,
              });
            else
              setSelectedLineupB({
                ...selectedLineupB,
                [slotModal.slot_index]: pid,
              });
            setSlotModal(null);
          }}
          selectedLineup={
            slotModal.teamKey === "A" ? selectedLineupA : selectedLineupB
          }
          selectedBench={
            slotModal.teamKey === "A" ? selectedBenchA : selectedBenchB
          }
        />
      )}
    </div>
  );
};
