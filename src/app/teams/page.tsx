import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Team = {
  id: string;
  name: string;
  department: string | null;
  logo_url: string | null;
  sports:
    | {
        name: string;
        icon: string | null;
        slug: string;
      }
    | {
        name: string;
        icon: string | null;
        slug: string;
      }[]
    | null;
  players:
    | {
        id: string;
        name: string;
        jersey_number: number | null;
        photo_url: string | null;
      }[]
    | null;
};

export default async function TeamsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("teams")
    .select(`
      id,
      name,
      department,
      logo_url,
      sports (
        name,
        icon,
        slug
      ),
      players (
        id,
        name,
        jersey_number,
        photo_url
      )
    `)
    .order("name", { ascending: true });

  if (error) {
    console.error("TEAMS PAGE ERROR:", error);
  }

  const teams = (data || []) as unknown as Team[];

  // Group teams by sport
  const groupedTeams = teams.reduce(
    (groups, team) => {
      const sport = Array.isArray(team.sports)
        ? team.sports[0]
        : team.sports;

      const sportName = sport?.name || "Other Sports";

      if (!groups[sportName]) {
        groups[sportName] = [];
      }

      groups[sportName].push(team);

      return groups;
    },
    {} as Record<string, Team[]>
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

            <Link href="/matches" className="transition hover:text-white">
              Matches
            </Link>

            <Link href="/teams" className="text-white">
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

        <div className="absolute right-1/4 top-10 h-80 w-80 rounded-full bg-purple-600/10 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-5 py-16 md:py-20">
          <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-purple-400">
            MIST Sports
          </span>

          <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
            Meet the
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 bg-clip-text text-transparent">
              Teams.
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-white/50 md:text-lg">
            Explore the teams representing MIST across every sport and
            discover the players competing for their department.
          </p>

          {/* Stats */}
          <div className="mt-8 flex flex-wrap gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-3">
              <div className="text-xl font-black">{teams.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/35">
                Teams
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-3">
              <div className="text-xl font-black">
                {Object.keys(groupedTeams).length}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/35">
                Sports
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-3">
              <div className="text-xl font-black">
                {teams.reduce(
                  (total, team) => total + (team.players?.length || 0),
                  0
                )}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/35">
                Players
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Teams */}
      <section className="mx-auto max-w-7xl px-5 py-12">
        {teams.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-20 text-center">
            <div className="text-5xl">🏆</div>

            <h2 className="mt-5 text-2xl font-black">
              No teams yet
            </h2>

            <p className="mt-2 text-sm text-white/35">
              Teams added by the sports club will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-14">
            {Object.entries(groupedTeams).map(
              ([sportName, sportTeams]) => {
                const firstTeam = sportTeams[0];

                const sport = Array.isArray(firstTeam?.sports)
                  ? firstTeam.sports[0]
                  : firstTeam?.sports;

                return (
                  <section key={sportName}>
                    {/* Sport heading */}
                    <div className="mb-7 flex items-end justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-2xl">
                          {sport?.icon || "🏆"}
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
                            Sport
                          </p>

                          <h2 className="mt-1 text-2xl font-black md:text-3xl">
                            {sportName}
                          </h2>
                        </div>
                      </div>

                      <span className="text-sm text-white/30">
                        {sportTeams.length}{" "}
                        {sportTeams.length === 1 ? "team" : "teams"}
                      </span>
                    </div>

                    {/* Team cards */}
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {sportTeams.map((team) => {
                        const players = team.players || [];

                        return (
                          <div
                            key={team.id}
                            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] transition duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:bg-white/[0.055]"
                          >
                            {/* Glow */}
                            <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-blue-600/10 blur-3xl transition group-hover:bg-blue-600/20" />

                            <div className="relative p-6">
                              {/* Team identity */}
                              <div className="flex items-center gap-4">
                                {team.logo_url ? (
                                  <img
                                    src={team.logo_url}
                                    alt={`${team.name} logo`}
                                    className="h-16 w-16 rounded-2xl object-cover"
                                  />
                                ) : (
                                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-3xl">
                                    {sport?.icon || "🏆"}
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <h3 className="truncate text-lg font-black">
                                    {team.name}
                                  </h3>

                                  <p className="mt-1 truncate text-sm text-white/40">
                                    {team.department || "Department not specified"}
                                  </p>
                                </div>
                              </div>

                              {/* Players */}
                              <div className="mt-7">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold uppercase tracking-wider text-white/35">
                                    Squad
                                  </span>

                                  <span className="text-xs font-bold text-blue-400">
                                    {players.length}{" "}
                                    {players.length === 1
                                      ? "Player"
                                      : "Players"}
                                  </span>
                                </div>

                                {players.length === 0 ? (
                                  <div className="mt-4 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-5 text-center text-xs text-white/30">
                                    No players added yet
                                  </div>
                                ) : (
                                  <div className="mt-4 flex -space-x-2">
                                    {players
                                      .slice(0, 6)
                                      .map((player) => (
                                        <div
                                          key={player.id}
                                          className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-[#08101f] bg-white/10"
                                          title={player.name}
                                        >
                                          {player.photo_url ? (
                                            <img
                                              src={player.photo_url}
                                              alt={player.name}
                                              className="h-full w-full object-cover"
                                            />
                                          ) : (
                                            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white/50">
                                              {player.name
                                                .charAt(0)
                                                .toUpperCase()}
                                            </div>
                                          )}
                                        </div>
                                      ))}

                                    {players.length > 6 && (
                                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#08101f] bg-white/10 text-[10px] font-bold text-white/50">
                                        +{players.length - 6}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Player names */}
                              {players.length > 0 && (
                                <div className="mt-5 space-y-2">
                                  {players.slice(0, 4).map((player) => (
                                    <div
                                      key={player.id}
                                      className="flex items-center justify-between rounded-xl bg-white/[0.025] px-3 py-2"
                                    >
                                      <div className="flex min-w-0 items-center gap-2">
                                        <span className="text-xs font-bold text-white/25">
                                          {player.jersey_number
                                            ? `#${player.jersey_number}`
                                            : "•"}
                                        </span>

                                        <span className="truncate text-sm font-medium text-white/70">
                                          {player.name}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {players.length > 4 && (
                                <p className="mt-4 text-center text-xs text-white/25">
                                  + {players.length - 4} more players
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              }
            )}
          </div>
        )}
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