"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Match = {
  id: string;
  status: "scheduled" | "live" | "completed" | "cancelled";
  score_a: number;
  score_b: number;
  scheduled_at: string | null;

  sports: {
    name: string;
    icon: string | null;
  } | null;

  team_a: {
    name: string;
    department: string | null;
  } | null;

  team_b: {
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
  created_at: string;
};

export default function LiveMatchPage() {
  const params = useParams();

  const matchId = params.matchId as string;

  const supabase = createClient();

  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const [winnerName, setWinnerName] = useState("");
  const [winnerScore, setWinnerScore] = useState(0);
  const [loserScore, setLoserScore] = useState(0);
  const [isDraw, setIsDraw] = useState(false);

  // Keeps track of the previous match status so celebration
  // happens ONLY when LIVE -> COMPLETED.
  const previousStatusRef = useRef<
    "scheduled" | "live" | "completed" | "cancelled" | null
  >(null);

  // Prevent duplicate celebration.
  const celebratedRef = useRef(false);

  useEffect(() => {
    loadMatch();
    loadEvents();

    const channel = supabase
      .channel(`live-match-${matchId}`)

      // Match score/status updates
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          console.log("LIVE MATCH UPDATE:", payload);

          const incomingMatch = payload.new as Partial<Match>;

          setMatch((current) => {
            if (!current) return current;

            const oldStatus = current.status;
            const newStatus = incomingMatch.status;

            const updatedMatch = {
              ...current,
              ...incomingMatch,
            } as Match;

            /*
             * Celebration only happens when:
             *
             * LIVE
             *   ↓
             * COMPLETED
             */
            if (
              oldStatus === "live" &&
              newStatus === "completed" &&
              !celebratedRef.current
            ) {
              celebratedRef.current = true;

              const scoreA = Number(
                incomingMatch.score_a ?? current.score_a ?? 0
              );

              const scoreB = Number(
                incomingMatch.score_b ?? current.score_b ?? 0
              );

              if (scoreA === scoreB) {
                // Draw
                setIsDraw(true);
                setWinnerName("It's a Draw");
                setWinnerScore(scoreA);
                setLoserScore(scoreB);
              } else if (scoreA > scoreB) {
                // Team A wins
                setIsDraw(false);
                setWinnerName(current.team_a?.name || "Team A");
                setWinnerScore(scoreA);
                setLoserScore(scoreB);
              } else {
                // Team B wins
                setIsDraw(false);
                setWinnerName(current.team_b?.name || "Team B");
                setWinnerScore(scoreB);
                setLoserScore(scoreA);
              }

              setShowCelebration(true);

              // Automatically close celebration after 5 seconds.
              window.setTimeout(() => {
                setShowCelebration(false);
              }, 5000);
            }

            return updatedMatch;
          });

          previousStatusRef.current = incomingMatch.status ?? null;
        }
      )

      // New match event
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "match_events",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          console.log("LIVE EVENT:", payload);

          setEvents((current) => [
            payload.new as MatchEvent,
            ...current,
          ]);
        }
      )

      .subscribe((status) => {
        console.log("Realtime status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  async function loadMatch() {
    const { data, error } = await supabase
      .from("matches")
      .select(`
        id,
        status,
        score_a,
        score_b,
        scheduled_at,
        sports (
          name,
          icon
        ),
        team_a:teams!matches_team_a_id_fkey (
          name,
          department
        ),
        team_b:teams!matches_team_b_id_fkey (
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
      console.error(error);
      setError(error.message);
      setLoading(false);
      return;
    }

    const loadedMatch = data as unknown as Match;

    setMatch(loadedMatch);

    // Important:
    // If the student opens an already-completed match,
    // don't show the celebration.
    previousStatusRef.current = loadedMatch.status;

    setLoading(false);
  }

  async function loadEvents() {
    const { data, error } = await supabase
      .from("match_events")
      .select(
        "id,team,event_type,points,created_at"
      )
      .eq("match_id", matchId)
      .order("created_at", {
        ascending: false,
      })
      .limit(30);

    if (error) {
      console.error(error);
      return;
    }

    setEvents(data || []);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05050a] text-white">
        <div className="text-center">
          <div className="text-5xl">
            🏟️
          </div>

          <p className="mt-4 text-sm text-white/40">
            Loading live match...
          </p>
        </div>
      </main>
    );
  }

  if (error || !match) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05050a] px-6 text-white">
        <div className="text-center">
          <div className="text-5xl">
            😕
          </div>

          <h1 className="mt-5 text-2xl font-black">
            Match unavailable
          </h1>

          <p className="mt-2 text-sm text-white/40">
            {error || "This match could not be found."}
          </p>

          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-white px-5 py-3 text-sm font-bold text-black"
          >
            Back Home
          </Link>
        </div>
      </main>
    );
  }

  const sport = match.sports;

  const isLive = match.status === "live";
  const isCompleted = match.status === "completed";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05050a] text-white">

      {/* ========================================================= */}
      {/* CELEBRATION OVERLAY                                      */}
      {/* ========================================================= */}

      {showCelebration && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black/80 px-5 backdrop-blur-md">

          {/* Confetti */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 90 }).map((_, index) => (
              <span
                key={index}
                className="celebration-confetti"
                style={{
                  left: `${(index * 37) % 100}%`,
                  animationDelay: `${(index % 12) * 0.08}s`,
                  animationDuration: `${2.5 + (index % 5) * 0.35}s`,
                  transform: `rotate(${index * 37}deg)`,
                }}
              />
            ))}
          </div>

          {/* Background glow */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400/10 blur-[120px]" />

          {/* Celebration card */}
          <div className="celebration-card relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/15 bg-[#080d20]/95 p-8 text-center shadow-2xl sm:p-10">

            {/* Top glow */}
            <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-72 -translate-x-1/2 rounded-full bg-yellow-400/15 blur-[80px]" />

            <div className="relative">

              {isDraw ? (
                <>
                  {/* Draw */}
                  <div className="celebration-trophy text-7xl">
                    🤝
                  </div>

                  <p className="mt-5 text-xs font-black uppercase tracking-[0.35em] text-blue-400">
                    Match Completed
                  </p>

                  <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                    IT&apos;S A DRAW!
                  </h2>

                  <p className="mt-4 text-sm text-white/40">
                    What a battle!
                  </p>
                </>
              ) : (
                <>
                  {/* Trophy */}
                  <div className="celebration-trophy text-7xl sm:text-8xl">
                    🏆
                  </div>

                  <p className="mt-5 text-xs font-black uppercase tracking-[0.35em] text-yellow-400">
                    Match Completed
                  </p>

                  <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                    VICTORY!
                  </h2>

                  <p className="mt-4 text-sm font-medium text-white/40">
                    Congratulations to
                  </p>

                  <h3 className="mt-2 break-words text-3xl font-black sm:text-4xl">
                    {winnerName}
                  </h3>
                </>
              )}

              {/* Final score */}
              <div className="mx-auto mt-8 flex max-w-xs items-center justify-center gap-6 rounded-2xl border border-white/10 bg-white/[0.05] px-7 py-5">

                <div className="text-center">
                  <div className="text-4xl font-black sm:text-5xl">
                    {isDraw ? winnerScore : winnerScore}
                  </div>

                  <div className="mt-1 text-[9px] font-bold uppercase tracking-wider text-white/25">
                    Final
                  </div>
                </div>

                <span className="text-xl font-black text-white/20">
                  —
                </span>

                <div className="text-center">
                  <div className="text-4xl font-black sm:text-5xl">
                    {loserScore}
                  </div>

                  <div className="mt-1 text-[9px] font-bold uppercase tracking-wider text-white/25">
                    Final
                  </div>
                </div>

              </div>

              <p className="mt-7 text-xs font-bold tracking-[0.25em] text-white/25">
                PLAY • COMPETE • UNITE.
              </p>

              <button
                type="button"
                onClick={() => setShowCelebration(false)}
                className="mt-7 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-bold text-white/50 transition hover:bg-white/10 hover:text-white"
              >
                Continue Watching
              </button>

            </div>
          </div>

          {/* Celebration styles */}
          <style jsx>{`
            .celebration-confetti {
              position: absolute;
              top: -30px;
              width: 9px;
              height: 16px;
              border-radius: 2px;
              background: linear-gradient(
                135deg,
                #22d3ee,
                #818cf8,
                #f472b6,
                #facc15,
                #34d399
              );
              animation: confetti-fall linear forwards;
              opacity: 0.95;
            }

            .celebration-card {
              animation: celebration-pop 0.55s
                cubic-bezier(0.175, 0.885, 0.32, 1.275)
                forwards;
            }

            .celebration-trophy {
              animation: trophy-bounce 1s
                cubic-bezier(0.175, 0.885, 0.32, 1.275)
                infinite alternate;
              filter: drop-shadow(0 15px 35px rgba(250, 204, 21, 0.25));
            }

            @keyframes confetti-fall {
              0% {
                transform: translateY(-40px) rotate(0deg);
              }

              100% {
                transform: translateY(110vh) rotate(720deg);
              }
            }

            @keyframes celebration-pop {
              0% {
                opacity: 0;
                transform: scale(0.65) translateY(30px);
              }

              100% {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }

            @keyframes trophy-bounce {
              0% {
                transform: translateY(0) rotate(-3deg) scale(1);
              }

              100% {
                transform: translateY(-12px) rotate(3deg) scale(1.05);
              }
            }
          `}</style>
        </div>
      )}

      {/* ========================================================= */}
      {/* HEADER                                                    */}
      {/* ========================================================= */}

      <header className="border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">

          <div>
            <p className="text-xs font-black tracking-[0.3em] text-blue-400">
              MIST SPORTS
            </p>

            <div className="mt-2 flex items-center gap-2">
              <span className="text-xl">
                {sport?.icon || "🏆"}
              </span>

              <span className="font-bold">
                {sport?.name || "Match"}
              </span>
            </div>
          </div>

          {isLive && (
            <div className="flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />

              <span className="text-xs font-black uppercase tracking-widest text-red-300">
                Live
              </span>
            </div>
          )}

          {isCompleted && (
            <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-emerald-300">
              Final
            </div>
          )}

        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN CONTENT                                               */}
      {/* ========================================================= */}

      <div className="mx-auto max-w-5xl px-5 py-8">

        {/* Match card */}
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-red-500/10">

          <div className="border-b border-white/10 px-6 py-5 text-center">

            <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/30">
              {match.venues?.name || "Venue"}
            </p>

            {match.venues?.location && (
              <p className="mt-1 text-xs text-white/20">
                {match.venues.location}
              </p>
            )}

          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr]">

            {/* Team A */}
            <div className="px-6 py-10 text-center">

              <p className="text-xl font-black md:text-2xl">
                {match.team_a?.name || "Team A"}
              </p>

              {match.team_a?.department && (
                <p className="mt-2 text-xs text-white/30">
                  {match.team_a.department}
                </p>
              )}

              <p className="mt-5 text-7xl font-black tracking-tighter md:text-8xl">
                {match.score_a}
              </p>

            </div>

            {/* VS */}
            <div className="flex flex-col items-center justify-center border-y border-white/10 px-8 py-5 md:border-x md:border-y-0">

              <span className="text-xs font-black uppercase tracking-[0.3em] text-white/20">
                VS
              </span>

              <span className="mt-2 text-2xl">
                {sport?.icon || "🏆"}
              </span>

            </div>

            {/* Team B */}
            <div className="px-6 py-10 text-center">

              <p className="text-xl font-black md:text-2xl">
                {match.team_b?.name || "Team B"}
              </p>

              {match.team_b?.department && (
                <p className="mt-2 text-xs text-white/30">
                  {match.team_b.department}
                </p>
              )}

              <p className="mt-5 text-7xl font-black tracking-tighter md:text-8xl">
                {match.score_b}
              </p>

            </div>

          </div>
        </section>

        {/* Live status */}
        <div className="mt-6 text-center">

          {isLive && (
            <p className="text-sm font-bold text-red-400">
              🔴 Live score • Updates automatically
            </p>
          )}

          {match.status === "scheduled" && (
            <p className="text-sm text-white/40">
              Match has not started yet.
            </p>
          )}

          {isCompleted && (
            <p className="text-sm font-bold text-emerald-400">
              🏆 Match completed
            </p>
          )}

        </div>

        {/* Match information */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2">

          <InfoCard
            label="Sport"
            value={`${sport?.icon || ""} ${
              sport?.name || "Unknown"
            }`}
          />

          <InfoCard
            label="Venue"
            value={match.venues?.name || "TBD"}
          />

        </section>

        {/* Live moments */}
        <section className="mt-10">

          <div className="mb-5">

            <p className="text-xs font-black uppercase tracking-[0.3em] text-white/30">
              Live Moments
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Match Timeline
            </h2>

          </div>

          {events.length === 0 ? (

            <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">

              <p className="text-sm text-white/30">
                No scoring moments yet.
              </p>

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
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4"
                  >

                    <div className="flex items-center gap-4">

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                        {sport?.icon || "🏆"}
                      </div>

                      <div>

                        <p className="font-bold">
                          {teamName || "Team"}
                        </p>

                        <p className="mt-1 text-xs text-white/30">
                          {formatEventName(
                            event.event_type
                          )}
                          {" • "}
                          {new Date(
                            event.created_at
                          ).toLocaleTimeString(
                            "en-IN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>

                      </div>

                    </div>

                    <span
                      className={`text-lg font-black ${
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

      </div>

    </main>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

      <p className="text-xs font-bold uppercase tracking-widest text-white/30">
        {label}
      </p>

      <p className="mt-2 font-bold">
        {value}
      </p>

    </div>
  );
}

function formatEventName(eventType: string) {
  return eventType
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}