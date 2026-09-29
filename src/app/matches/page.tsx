import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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

function formatDate(date: string | null) {
  if (!date) return "Date TBA";

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatTime(date: string | null) {
  if (!date) return "Time TBA";

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

function MatchCard({ match }: { match: Match }) {
  const isLive = match.status === "live";
  const isCompleted = match.status === "completed";
  const isCancelled = match.status === "cancelled";

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] transition duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:bg-white/[0.055]">
      {/* Glow */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-blue-600/10 blur-3xl transition group-hover:bg-blue-600/20" />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-2xl">
              {match.sports?.icon || "🏆"}
            </div>

            <div>
              <p className="text-sm font-bold">
                {match.sports?.name || "Sports"}
              </p>

              <p className="mt-0.5 text-xs text-white/35">
                {match.venues?.name || "Venue TBA"}
              </p>
            </div>
          </div>

          {isLive && (
            <span className="flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-[10px] font-black tracking-wider text-red-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              LIVE
            </span>
          )}

          {isCompleted && (
            <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-[10px] font-black tracking-wider text-green-400">
              COMPLETED
            </span>
          )}

          {isCancelled && (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black tracking-wider text-white/40">
              CANCELLED
            </span>
          )}

          {!isLive && !isCompleted && !isCancelled && (
            <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-[10px] font-black tracking-wider text-blue-400">
              UPCOMING
            </span>
          )}
        </div>

        {/* Date / Time */}
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/35">
            {formatDate(match.scheduled_at)}
          </p>

          <p className="mt-1 text-sm font-bold text-white/70">
            {formatTime(match.scheduled_at)}
          </p>
        </div>

        {/* Teams */}
        <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="min-w-0 text-center">
            <div className="truncate text-base font-bold md:text-lg">
              {match.team_a?.name || "Team A"}
            </div>

            {match.team_a?.department && (
              <div className="mt-1 truncate text-xs text-white/30">
                {match.team_a.department}
              </div>
            )}

            {(isLive || isCompleted) && (
              <div className="mt-3 text-3xl font-black">
                {match.score_a ?? 0}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-white/20">
              {isLive || isCompleted ? "-" : "VS"}
            </span>
          </div>

          <div className="min-w-0 text-center">
            <div className="truncate text-base font-bold md:text-lg">
              {match.team_b?.name || "Team B"}
            </div>

            {match.team_b?.department && (
              <div className="mt-1 truncate text-xs text-white/30">
                {match.team_b.department}
              </div>
            )}

            {(isLive || isCompleted) && (
              <div className="mt-3 text-3xl font-black">
                {match.score_b ?? 0}
              </div>
            )}
          </div>
        </div>

        {/* Venue */}
        <div className="mt-7 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-white/35">
          <span>📍</span>

          <span>
            {match.venues?.name || "Venue TBA"}
            {match.venues?.location
              ? ` • ${match.venues.location}`
              : ""}
          </span>
        </div>

        {/* Action */}
        {isLive && (
          <Link
            href={`/live/${match.id}`}
            className="mt-5 flex w-full items-center justify-center rounded-xl bg-red-500 px-4 py-3 text-sm font-black text-white transition hover:bg-red-400"
          >
            🔴 Watch Live →
          </Link>
        )}

        {isCompleted && (
          <Link
            href={`/live/${match.id}`}
            className="mt-5 flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            View Match →
          </Link>
        )}
      </div>
    </div>
  );
}

export default async function MatchesPage() {
  const supabase = await createClient();

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
    .order("scheduled_at", { ascending: true });

  if (error) {
    console.error("MATCHES PAGE ERROR:", error);
  }

  const matches = (data || []) as unknown as Match[];

  const liveMatches = matches.filter(
    (match) => match.status === "live"
  );

  const upcomingMatches = matches.filter(
    (match) => match.status === "scheduled"
  );

  const completedMatches = matches.filter(
    (match) => match.status === "completed"
  );

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="group">
            <div className="text-xl font-black tracking-tight">
              MIST <span className="text-blue-500">SPORTS</span>
            </div>

            <div className="text-[9px] font-semibold tracking-[0.3em] text-white/40">
              ONE CAMPUS. ALL GAMES.
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-white/60 md:flex">
            <Link href="/" className="transition hover:text-white">
              Home
            </Link>

            <Link href="/live" className="transition hover:text-white">
              Live
            </Link>

            <Link href="/matches" className="text-white">
              Matches
            </Link>

            <Link href="/teams" className="transition hover:text-white">
              Teams
            </Link>
          </nav>

          <Link
            href="/login"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
          >
            🔐 Staff Login
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute left-1/4 top-0 h-80 w-80 rounded-full bg-blue-600/10 blur-[120px]" />

        <div className="absolute right-1/4 top-20 h-72 w-72 rounded-full bg-purple-600/10 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-5 py-16 md:py-20">
          <div className="mb-4">
            <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-400">
              MIST Sports
            </span>
          </div>

          <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
            Fixtures.
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 bg-clip-text text-transparent">
              Results. Rivalries.
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-white/50 md:text-lg">
            Follow every game happening across MIST. Check upcoming fixtures,
            live matches and completed results.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-5 py-12">
        {/* Live */}
        {liveMatches.length > 0 && (
          <div className="mb-14">
            <div className="mb-7 flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">
                  Happening now
                </p>

                <h2 className="mt-2 text-2xl font-black md:text-3xl">
                  Live
                </h2>
              </div>

              <Link
                href="/live"
                className="text-sm font-bold text-blue-400 transition hover:text-blue-300"
              >
                All Live →
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {liveMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming */}
        <div className="mb-14">
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
              Coming up
            </p>

            <h2 className="mt-2 text-2xl font-black md:text-3xl">
              Upcoming Fixtures
            </h2>
          </div>

          {upcomingMatches.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
              <div className="text-4xl">📅</div>

              <h3 className="mt-4 text-xl font-bold">
                No upcoming fixtures
              </h3>

              <p className="mt-2 text-sm text-white/35">
                New fixtures will appear here once they are scheduled.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {upcomingMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </div>

        {/* Completed */}
        <div>
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-400">
              Final scores
            </p>

            <h2 className="mt-2 text-2xl font-black md:text-3xl">
              Completed Matches
            </h2>
          </div>

          {completedMatches.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
              <div className="text-4xl">🏆</div>

              <h3 className="mt-4 text-xl font-bold">
                No results yet
              </h3>

              <p className="mt-2 text-sm text-white/35">
                Completed match results will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {completedMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-10 border-t border-white/10 px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center text-xs text-white/30 md:flex-row md:text-left">
          <div>
            © {new Date().getFullYear()} MIST SPORTS
          </div>

          <div className="font-medium">
            PLAY • COMPETE • UNITE.
          </div>

          <Link
            href="/login"
            className="transition hover:text-white"
          >
            Staff Login →
          </Link>
        </div>
      </footer>
    </main>
  );
}