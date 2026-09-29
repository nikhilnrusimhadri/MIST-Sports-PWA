import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type LiveMatch = {
  id: string;
  status: string;
  score_a: number;
  score_b: number;
  scheduled_at: string | null;

  sports:
    | {
        name: string;
        icon: string | null;
      }
    | {
        name: string;
        icon: string | null;
      }[]
    | null;

  team_a:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;

  team_b:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;

  venues:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

type Sport = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

export default async function HomePage() {
  const supabase = await createClient();

  const { data: liveMatches } = await supabase
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
        name
      ),
      team_b:teams!matches_team_b_id_fkey (
        name
      ),
      venues (
        name
      )
    `)
    .eq("status", "live")
    .order("updated_at", {
      ascending: false,
    })
    .limit(6);

  const { data: sports } = await supabase
    .from("sports")
    .select("id,name,slug,icon")
    .order("name");

  return (
    <main className="min-h-screen bg-[#05050a] text-white">

      {/* ========================================================= */}
      {/* NAVIGATION */}
      {/* ========================================================= */}

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#05050a]/85 backdrop-blur-xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">

          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-3"
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl">
              🏆
            </div>

            <div>
              <p className="text-sm font-black tracking-[0.25em] text-blue-400">
                MIST
              </p>

              <p className="text-xs font-bold text-white/50">
                SPORTS
              </p>
            </div>

          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-7 text-sm font-semibold text-white/50 md:flex">

            <Link
              href="/live"
              className="transition hover:text-white"
            >
              Live
            </Link>

            <Link
              href="/matches"
              className="transition hover:text-white"
            >
              Matches
            </Link>

            <Link
              href="/teams"
              className="transition hover:text-white"
            >
              Teams
            </Link>

          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">

            {/* Live */}
            <Link
              href="/live"
              className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-red-300 transition hover:bg-red-500/20 sm:px-4"
            >
              <span className="mr-1">
                🔴
              </span>
              <span className="hidden sm:inline">
                Live
              </span>
            </Link>

            {/* Staff Login */}
            <Link
              href="/login"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/70 transition hover:bg-white/10 hover:text-white sm:px-4"
            >
              🔐{" "}
              <span className="hidden sm:inline">
                Staff Login
              </span>
              <span className="sm:hidden">
                Login
              </span>
            </Link>

          </div>

        </div>

      </header>

      {/* ========================================================= */}
      {/* HERO */}
      {/* ========================================================= */}

      <section className="relative overflow-hidden">

        {/* Background glow */}
        <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[120px]" />

        <div className="absolute -left-40 top-60 h-80 w-80 rounded-full bg-purple-600/10 blur-[100px]" />

        <div className="absolute -right-40 top-80 h-80 w-80 rounded-full bg-orange-500/10 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-20 md:pb-28 md:pt-28">

          {/* Eyebrow */}
          <div className="flex items-center gap-3">

            <span className="h-px w-8 bg-blue-500" />

            <p className="text-sm font-black uppercase tracking-[0.35em] text-blue-400">
              MIST SPORTS CLUB
            </p>

          </div>

          {/* Heading */}
          <h1 className="mt-6 max-w-5xl text-5xl font-black leading-[0.92] tracking-tight sm:text-6xl md:text-8xl">

            ONE CAMPUS.

            <br />

            <span className="text-white/25">
              ALL GAMES.
            </span>

          </h1>

          {/* Description */}
          <p className="mt-8 max-w-xl text-base leading-7 text-white/45 md:text-lg">

            Follow every match, every score and every moment
            of the MIST sports tournament — live from campus.

          </p>

          {/* Hero actions */}
          <div className="mt-9 flex flex-wrap gap-3">

            <Link
              href="/live"
              className="rounded-xl bg-white px-6 py-3.5 text-sm font-black text-black transition hover:bg-white/90"
            >
              🔴 Watch Live
            </Link>

            <Link
              href="/matches"
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              View Fixtures
            </Link>

          </div>

          {/* Staff hint */}
          <div className="mt-8">

            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-white/30 transition hover:text-white/70"
            >
              🔐 Sports Club Staff?
              <span className="text-blue-400">
                Login here →
              </span>
            </Link>

          </div>

        </div>

      </section>

      {/* ========================================================= */}
      {/* LIVE NOW */}
      {/* ========================================================= */}

      <section className="mx-auto max-w-7xl px-5 py-12">

        <div className="mb-7 flex items-end justify-between">

          <div>

            <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">
              Happening Now
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Live Matches
            </h2>

          </div>

          <Link
            href="/live"
            className="text-sm font-bold text-white/40 transition hover:text-white"
          >
            View all →
          </Link>

        </div>

        {!liveMatches || liveMatches.length === 0 ? (

          <div className="rounded-3xl border border-dashed border-white/10 p-14 text-center">

            <div className="text-5xl">
              🏟️
            </div>

            <h3 className="mt-5 text-xl font-black">
              No live matches right now
            </h3>

            <p className="mt-2 text-sm text-white/35">
              Check back when the games begin.
            </p>

          </div>

        ) : (

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            {(liveMatches as LiveMatch[]).map((match) => {

              const sport = Array.isArray(match.sports)
                ? match.sports[0]
                : match.sports;

              const teamA = Array.isArray(match.team_a)
                ? match.team_a[0]
                : match.team_a;

              const teamB = Array.isArray(match.team_b)
                ? match.team_b[0]
                : match.team_b;

              const venue = Array.isArray(match.venues)
                ? match.venues[0]
                : match.venues;

              return (
                <Link
                  key={match.id}
                  href={`/live/${match.id}`}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
                >

                  {/* Card header */}
                  <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">

                    <div className="flex items-center gap-2">

                      <span className="text-lg">
                        {sport?.icon || "🏆"}
                      </span>

                      <span className="text-xs font-bold text-white/60">
                        {sport?.name || "Match"}
                      </span>

                    </div>

                    <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-400">

                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />

                      Live

                    </span>

                  </div>

                  {/* Teams */}
                  <div className="p-6">

                    <div className="flex items-center justify-between">

                      <div>

                        <p className="font-bold">
                          {teamA?.name || "Team A"}
                        </p>

                        <p className="mt-4 font-bold">
                          {teamB?.name || "Team B"}
                        </p>

                      </div>

                      <div className="text-right">

                        <p className="text-3xl font-black">
                          {match.score_a}
                        </p>

                        <p className="mt-2 text-3xl font-black">
                          {match.score_b}
                        </p>

                      </div>

                    </div>

                    {/* Venue */}
                    <div className="mt-6 border-t border-white/10 pt-4 text-xs text-white/30">
                      📍 {venue?.name || "Venue"}
                    </div>

                  </div>

                </Link>
              );
            })}

          </div>

        )}

      </section>

      {/* ========================================================= */}
      {/* SPORTS */}
      {/* ========================================================= */}

      <section className="mx-auto max-w-7xl px-5 py-14">

        <div className="mb-7">

          <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">
            Tournament
          </p>

          <h2 className="mt-2 text-3xl font-black">
            All Sports
          </h2>

          <p className="mt-2 max-w-xl text-sm text-white/35">
            Explore fixtures, results and live matches across
            every MIST sports event.
          </p>

        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">

          {(sports as Sport[] | null)?.map((sport) => (

            <Link
              key={sport.id}
              href={`/matches?sport=${sport.slug}`}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
            >

              <div className="text-3xl transition-transform group-hover:scale-110">
                {sport.icon || "🏆"}
              </div>

              <p className="mt-4 font-bold">
                {sport.name}
              </p>

              <p className="mt-1 text-xs text-white/30">
                View matches →
              </p>

            </Link>

          ))}

        </div>

      </section>

      {/* ========================================================= */}
      {/* STAFF CTA */}
      {/* ========================================================= */}

      <section className="mx-auto max-w-7xl px-5 py-14">

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent p-8 md:p-10">

          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">

            <div>

              <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">
                Sports Club
              </p>

              <h2 className="mt-2 text-2xl font-black md:text-3xl">
                Tournament staff?
              </h2>

              <p className="mt-2 max-w-lg text-sm leading-6 text-white/40">
                Admins manage fixtures and teams. Scorers manage
                assigned matches and live scores.
              </p>

            </div>

            <Link
              href="/login"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-6 py-3.5 text-sm font-black text-black transition hover:bg-white/90"
            >
              🔐 Staff Login
            </Link>

          </div>

        </div>

      </section>

      {/* ========================================================= */}
      {/* FOOTER */}
      {/* ========================================================= */}

      <footer className="border-t border-white/10">

        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-xs text-white/25 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="font-bold text-white/40">
              MIST SPORTS CLUB
            </p>

            <p className="mt-1">
              One Campus. All Games.
            </p>
          </div>

          <div className="flex items-center gap-5">

            <Link
              href="/live"
              className="transition hover:text-white"
            >
              Live
            </Link>

            <Link
              href="/matches"
              className="transition hover:text-white"
            >
              Matches
            </Link>

            <Link
              href="/login"
              className="transition hover:text-white"
            >
              Staff Login
            </Link>

          </div>

          <p>
            PLAY • COMPETE • UNITE
          </p>

        </div>

      </footer>

    </main>
  );
}