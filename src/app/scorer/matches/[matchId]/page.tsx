"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Match = {
  id: string;
  scheduled_at: string | null;
  status: "scheduled" | "live" | "completed" | "cancelled";
  score_a: number;
  score_b: number;
  sport_data: Record<string, unknown> | null;

  sports: {
    id: string;
    name: string;
    icon: string | null;
  } | null;

  team_a: {
    id: string;
    name: string;
    department: string | null;
  } | null;

  team_b: {
    id: string;
    name: string;
    department: string | null;
  } | null;

  venues: {
    name: string;
    location: string | null;
  } | null;
};

type MatchEvent = {
  id: string;
  team: string | null;
  event_type: string;
  points: number;
  event_data: Record<string, unknown> | null;
  created_at: string;
};

export default function ScorerMatchPage() {
  const params = useParams();
  const router = useRouter();

  const matchId = params.matchId as string;

  const supabase = createClient();

  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMatch();

    const channel = supabase
      .channel(`scorer-match-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "matches",
          filter: `id=eq.${matchId}`,
        },
        () => {
          loadMatch();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "match_events",
          filter: `match_id=eq.${matchId}`,
        },
        () => {
          loadEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  async function loadMatch() {
    const { data, error } = await supabase
      .from("matches")
      .select(`
        id,
        scheduled_at,
        status,
        score_a,
        score_b,
        sport_data,
        sports (
          id,
          name,
          icon
        ),
        team_a:teams!matches_team_a_id_fkey (
          id,
          name,
          department
        ),
        team_b:teams!matches_team_b_id_fkey (
          id,
          name,
          department
        ),
        venues (
          name,
          location
        )
      `)
      .eq("id", matchId)
      .single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMatch(data as unknown as Match);

    await loadEvents();

    setLoading(false);
  }

  async function loadEvents() {
    const { data, error } = await supabase
      .from("match_events")
      .select(
        "id,team,event_type,points,event_data,created_at"
      )
      .eq("match_id", matchId)
      .order("created_at", {
        ascending: false,
      })
      .limit(50);

    if (!error) {
      setEvents(data || []);
    }
  }

  async function updateMatch(
    updates: Record<string, unknown>
  ) {
    if (!match) return;

    setActionLoading(true);
    setError("");

    const { error } = await supabase
      .from("matches")
      .update(updates)
      .eq("id", match.id);

    if (error) {
      setError(error.message);
    }

    setActionLoading(false);

    await loadMatch();
  }

  async function startMatch() {
    await updateMatch({
      status: "live",
    });
  }

  async function finishMatch() {
    if (!match) return;

    const confirmed = window.confirm(
      "Finish this match? The score will be finalized."
    );

    if (!confirmed) return;

    await updateMatch({
      status: "completed",
    });
  }

  async function changeScore(
    team: "a" | "b",
    points: number,
    eventType = "point"
  ) {
    if (!match) return;

    if (match.status !== "live") {
      setError("Start the match before updating the score.");
      return;
    }

    const currentScore =
      team === "a"
        ? match.score_a
        : match.score_b;

    const newScore = Math.max(
      0,
      currentScore + points
    );

    const updates =
      team === "a"
        ? { score_a: newScore }
        : { score_b: newScore };

    setActionLoading(true);
    setError("");

    const { error: scoreError } = await supabase
      .from("matches")
      .update(updates)
      .eq("id", match.id);

    if (scoreError) {
      setError(scoreError.message);
      setActionLoading(false);
      return;
    }

    const { error: eventError } = await supabase
      .from("match_events")
      .insert({
        match_id: match.id,
        team,
        event_type: eventType,
        points,
        event_data: {},
      });

    if (eventError) {
      setError(eventError.message);
    }

    setActionLoading(false);

    await loadMatch();
    await loadEvents();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05050a] text-white">
        <div className="text-center">
          <div className="text-5xl">🏟️</div>
          <p className="mt-4 text-sm text-white/40">
            Loading live match...
          </p>
        </div>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05050a] text-white">
        <div className="text-center">
          <p className="text-xl font-bold">
            Match not found
          </p>

          <Link
            href="/scorer"
            className="mt-5 inline-block text-blue-400"
          >
            ← Back to scorer console
          </Link>
        </div>
      </main>
    );
  }

  const sportName =
    match.sports?.name?.toLowerCase() || "";

  const isLive = match.status === "live";
  const isCompleted = match.status === "completed";

  return (
    <main className="min-h-screen bg-[#05050a] text-white">

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#05050a]/90 backdrop-blur-xl">

        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

          <div>
            <Link
              href="/scorer"
              className="text-xs text-white/40 hover:text-white"
            >
              ← My Matches
            </Link>

            <div className="mt-1 flex items-center gap-2">
              <span className="text-xl">
                {match.sports?.icon || "🏆"}
              </span>

              <h1 className="font-black">
                {match.sports?.name}
              </h1>
            </div>
          </div>

          <StatusBadge status={match.status} />

        </div>

      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">

        {/* Match information */}
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02]">

          <div className="border-b border-white/10 px-6 py-4">

            <div className="flex flex-wrap items-center justify-between gap-3">

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/30">
                  Live Match
                </p>

                <p className="mt-1 text-sm text-white/50">
                  {match.venues?.name || "Venue"}
                </p>
              </div>

              {match.scheduled_at && (
                <p className="text-xs text-white/40">
                  {new Date(
                    match.scheduled_at
                  ).toLocaleString("en-IN")}
                </p>
              )}

            </div>

          </div>

          {/* Scoreboard */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr]">

            {/* Team A */}
            <TeamScore
              name={match.team_a?.name || "Team A"}
              department={match.team_a?.department}
              score={match.score_a}
              active={isLive}
              align="right"
            />

            {/* Center */}
            <div className="flex flex-col items-center justify-center border-y border-white/10 px-8 py-8 md:border-x md:border-y-0">

              <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/30">
                Score
              </p>

              <div className="mt-2 text-4xl font-black tracking-tight">
                {match.score_a}
                <span className="mx-3 text-white/20">
                  :
                </span>
                {match.score_b}
              </div>

              {isLive && (
                <div className="mt-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  Live
                </div>
              )}

            </div>

            {/* Team B */}
            <TeamScore
              name={match.team_b?.name || "Team B"}
              department={match.team_b?.department}
              score={match.score_b}
              active={isLive}
              align="left"
            />

          </div>

        </section>

        {/* Match controls */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/30">
                Match Controls
              </p>

              <h2 className="mt-1 text-xl font-black">
                {isCompleted
                  ? "Match completed"
                  : isLive
                    ? "Match in progress"
                    : "Ready to start"}
              </h2>
            </div>

            <div className="flex gap-3">

              {!isLive && !isCompleted && (
                <button
                  onClick={startMatch}
                  disabled={actionLoading}
                  className="rounded-xl bg-red-500 px-6 py-3 text-sm font-black text-white hover:bg-red-400 disabled:opacity-50"
                >
                  🔴 Start Match
                </button>
              )}

              {isLive && (
                <button
                  onClick={finishMatch}
                  disabled={actionLoading}
                  className="rounded-xl bg-white px-6 py-3 text-sm font-black text-black hover:bg-white/90 disabled:opacity-50"
                >
                  Finish Match
                </button>
              )}

            </div>

          </div>

        </section>

        {/* Score controls */}
        <section className="mt-6">

          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/30">
              {match.sports?.name} Scoring
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Update Score
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">

            <ScoreControl
              teamName={match.team_a?.name || "Team A"}
              score={match.score_a}
              disabled={!isLive || actionLoading}
              onAdd={() =>
                changeScore(
                  "a",
                  1,
                  getEventName(sportName, 1)
                )
              }
              onSubtract={() =>
                changeScore(
                  "a",
                  -1,
                  "score_correction"
                )
              }
            />

            <ScoreControl
              teamName={match.team_b?.name || "Team B"}
              score={match.score_b}
              disabled={!isLive || actionLoading}
              onAdd={() =>
                changeScore(
                  "b",
                  1,
                  getEventName(sportName, 1)
                )
              }
              onSubtract={() =>
                changeScore(
                  "b",
                  -1,
                  "score_correction"
                )
              }
            />

          </div>

          {/* Sport-specific quick actions */}
          <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.02] p-6">

            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/30">
              Quick Events
            </p>

            <div className="mt-4 flex flex-wrap gap-3">

              {sportName.includes("cricket") && (
                <>
                  <QuickEvent
                    label="🏏 +1 Run"
                    disabled={!isLive || actionLoading}
                    onClick={() => changeScore("a", 1, "run")}
                  />

                  <QuickEvent
                    label="🏏 +4 Runs"
                    disabled={!isLive || actionLoading}
                    onClick={() => changeScore("a", 4, "boundary_4")}
                  />

                  <QuickEvent
                    label="🏏 +6 Runs"
                    disabled={!isLive || actionLoading}
                    onClick={() => changeScore("a", 6, "boundary_6")}
                  />
                </>
              )}

              {sportName.includes("volleyball") && (
                <>
                  <QuickEvent
                    label="🏐 Point"
                    disabled={!isLive || actionLoading}
                    onClick={() => changeScore("a", 1, "point")}
                  />
                </>
              )}

              {sportName.includes("badminton") && (
                <>
                  <QuickEvent
                    label="🏸 Point"
                    disabled={!isLive || actionLoading}
                    onClick={() => changeScore("a", 1, "point")}
                  />
                </>
              )}

              {sportName.includes("carrom") && (
                <>
                  <QuickEvent
                    label="🎯 Point"
                    disabled={!isLive || actionLoading}
                    onClick={() => changeScore("a", 1, "point")}
                  />
                </>
              )}

              {sportName.includes("kabaddi") && (
                <>
                  <QuickEvent
                    label="🤼 Raid Point"
                    disabled={!isLive || actionLoading}
                    onClick={() => changeScore("a", 1, "raid_point")}
                  />

                  <QuickEvent
                    label="🤼 Tackle Point"
                    disabled={!isLive || actionLoading}
                    onClick={() => changeScore("a", 1, "tackle_point")}
                  />
                </>
              )}

              {sportName.includes("throwball") && (
                <>
                  <QuickEvent
                    label="🏐 Point"
                    disabled={!isLive || actionLoading}
                    onClick={() => changeScore("a", 1, "point")}
                  />
                </>
              )}

              {sportName.includes("kho") && (
                <>
                  <QuickEvent
                    label="🏃 Point"
                    disabled={!isLive || actionLoading}
                    onClick={() => changeScore("a", 1, "point")}
                  />
                </>
              )}

              {sportName.includes("chess") && (
                <p className="text-sm text-white/40">
                  Chess results will be handled through the match result controls.
                </p>
              )}

            </div>

            <p className="mt-4 text-xs text-white/30">
              The team-specific +1 / −1 controls above are the authoritative
              score controls. Quick Events are additional shortcuts.
            </p>

          </div>

        </section>

        {/* Event timeline */}
        <section className="mt-8">

          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/30">
              Match Timeline
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Recent Events
            </h2>
          </div>

          {events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-white/30">
              No scoring events yet.
            </div>
          ) : (
            <div className="space-y-3">

              {events.map((event) => {

                const teamName =
                  event.team === "a"
                    ? match.team_a?.name
                    : match.team_b?.name;

                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4"
                  >

                    <div>
                      <p className="font-semibold">
                        {teamName || "Team"}
                      </p>

                      <p className="mt-1 text-xs text-white/30">
                        {formatEventName(event.event_type)}
                        {" • "}
                        {new Date(
                          event.created_at
                        ).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <span
                      className={`font-black ${
                        event.points > 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {event.points > 0 ? "+" : ""}
                      {event.points}
                    </span>

                  </div>
                );
              })}

            </div>
          )}

        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

      </div>

    </main>
  );
}

function TeamScore({
  name,
  department,
  score,
  active,
  align,
}: {
  name: string;
  department: string | null | undefined;
  score: number;
  active: boolean;
  align: "left" | "right";
}) {
  return (
    <div
      className={`p-8 ${
        align === "right"
          ? "text-center md:text-right"
          : "text-center md:text-left"
      }`}
    >
      <p className="text-xl font-black">
        {name}
      </p>

      {department && (
        <p className="mt-1 text-xs text-white/30">
          {department}
        </p>
      )}

      <p
        className={`mt-5 text-7xl font-black tracking-tighter ${
          active ? "text-white" : "text-white/50"
        }`}
      >
        {score}
      </p>
    </div>
  );
}

function ScoreControl({
  teamName,
  score,
  disabled,
  onAdd,
  onSubtract,
}: {
  teamName: string;
  score: number;
  disabled: boolean;
  onAdd: () => void;
  onSubtract: () => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm font-bold">
            {teamName}
          </p>

          <p className="mt-1 text-xs text-white/30">
            Current score
          </p>
        </div>

        <span className="text-4xl font-black">
          {score}
        </span>

      </div>

      <div className="mt-6 grid grid-cols-[1fr_2fr] gap-3">

        <button
          onClick={onSubtract}
          disabled={disabled || score === 0}
          className="h-14 rounded-xl border border-white/10 bg-white/5 text-2xl font-black transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          −
        </button>

        <button
          onClick={onAdd}
          disabled={disabled}
          className="h-14 rounded-xl bg-white text-xl font-black text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          +1 POINT
        </button>

      </div>

    </div>
  );
}

function QuickEvent({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {label}
    </button>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    scheduled:
      "bg-blue-500/10 text-blue-300 border-blue-500/20",

    live:
      "bg-red-500/10 text-red-300 border-red-500/20",

    completed:
      "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",

    cancelled:
      "bg-white/5 text-white/40 border-white/10",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
        styles[status] || styles.scheduled
      }`}
    >
      {status}
    </span>
  );
}

function getEventName(
  sport: string,
  points: number
) {
  if (sport.includes("cricket")) {
    if (points === 6) return "boundary_6";
    if (points === 4) return "boundary_4";
    return "run";
  }

  return "point";
}

function formatEventName(eventType: string) {
  return eventType
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}