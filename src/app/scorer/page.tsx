import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ScorerPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "scorer") {
    redirect("/");
  }

  const { data: matches, error } = await supabase
    .from("matches")
    .select(`
      id,
      scheduled_at,
      status,
      score_a,
      score_b,
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
    .eq("scorer_id", user.id)
    .order("scheduled_at", { ascending: true });

  if (error) {
    console.error(error);
  }

  return (
    <main className="min-h-screen bg-[#05050a] text-white">

      {/* Header */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-xl">

        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

          <div>
            <p className="text-xs font-bold tracking-[0.3em] text-blue-400">
              MIST SPORTS
            </p>

            <h1 className="mt-1 text-2xl font-black">
              Scorer Console
            </h1>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold">
              {profile.full_name}
            </p>

            <p className="text-xs uppercase tracking-widest text-white/30">
              Match Scorer
            </p>
          </div>

        </div>

      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-red-500/15 via-purple-500/10 to-blue-500/10 p-8">

          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-red-500/20 blur-3xl" />

          <div className="relative">

            <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
              Match Operations
            </p>

            <h2 className="mt-3 text-4xl font-black">
              Your matches.
              <br />
              Your scoreboard.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-6 text-white/40">
              Start games, update scores and keep the campus scoreboard
              synchronized in real time.
            </p>

          </div>

        </section>

        {/* Matches */}
        <section className="mt-10">

          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/30">
              Assigned Matches
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Your Schedule
            </h2>
          </div>

          {!matches || matches.length === 0 ? (

            <div className="rounded-3xl border border-dashed border-white/10 p-14 text-center">

              <div className="text-5xl">
                🏟️
              </div>

              <h3 className="mt-5 text-xl font-bold">
                No matches assigned
              </h3>

              <p className="mt-2 text-sm text-white/40">
                Matches assigned to you by the administrator will appear here.
              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {matches.map((match: any) => {

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

                const date = match.scheduled_at
                  ? new Date(match.scheduled_at)
                  : null;

                return (
                  <div
                    key={match.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.05]"
                  >

                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                      {/* Sport */}
                      <div className="flex items-center gap-4">

                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                          {sport?.icon || "🏆"}
                        </div>

                        <div>

                          <p className="font-bold">
                            {sport?.name || "Unknown Sport"}
                          </p>

                          <p className="mt-1 text-xs text-white/40">
                            📍 {venue?.name || "Venue not assigned"}
                          </p>

                        </div>

                      </div>

                      {/* Match */}
                      <div className="flex items-center gap-5">

                        <div className="text-right">
                          <p className="font-bold">
                            {teamA?.name || "Team A"}
                          </p>

                          <p className="text-xs text-white/30">
                            {teamA?.department || ""}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white/10 px-4 py-2 text-sm font-black">
                          {match.score_a ?? 0}
                          <span className="mx-2 text-white/30">
                            -
                          </span>
                          {match.score_b ?? 0}
                        </div>

                        <div>
                          <p className="font-bold">
                            {teamB?.name || "Team B"}
                          </p>

                          <p className="text-xs text-white/30">
                            {teamB?.department || ""}
                          </p>
                        </div>

                      </div>

                      {/* Date / Action */}
                      <div className="flex items-center gap-5">

                        <div className="text-right">

                          <p className="text-sm font-semibold">
                            {date
                              ? date.toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                })
                              : "TBD"}
                          </p>

                          <p className="text-xs text-white/40">
                            {date
                              ? date.toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </p>

                        </div>

                        <StatusBadge status={match.status} />

                        <Link
                          href={`/scorer/matches/${match.id}`}
                          className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-black hover:bg-white/90"
                        >
                          Open
                        </Link>

                      </div>

                    </div>

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