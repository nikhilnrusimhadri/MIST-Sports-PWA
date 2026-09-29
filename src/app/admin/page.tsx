import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
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

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  const [
    sportsResult,
    teamsResult,
    playersResult,
    venuesResult,
    matchesResult,
  ] = await Promise.all([
    supabase.from("sports").select("*", { count: "exact", head: true }),
    supabase.from("teams").select("*", { count: "exact", head: true }),
    supabase.from("players").select("*", { count: "exact", head: true }),
    supabase.from("venues").select("*", { count: "exact", head: true }),
    supabase.from("matches").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    {
      label: "Sports",
      value: sportsResult.count ?? 0,
      href: "/admin/sports",
      icon: "🏆",
    },
    {
      label: "Teams",
      value: teamsResult.count ?? 0,
      href: "/admin/teams",
      icon: "👥",
    },
    {
      label: "Players",
      value: playersResult.count ?? 0,
      href: "/admin/players",
      icon: "⚡",
    },
    {
      label: "Venues",
      value: venuesResult.count ?? 0,
      href: "/admin/venues",
      icon: "📍",
    },
    {
      label: "Matches",
      value: matchesResult.count ?? 0,
      href: "/admin/matches",
      icon: "🔥",
    },
  ];

  return (
    <main className="min-h-screen bg-[#05050a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-bold tracking-[0.3em] text-blue-400">
              MIST SPORTS
            </p>

            <h1 className="mt-1 text-2xl font-black tracking-tight">
              Control Center
            </h1>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold">
              {profile.full_name}
            </p>

            <p className="text-xs uppercase tracking-widest text-white/40">
              Administrator
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-orange-500/10 p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-300">
              Sports Club Administration
            </p>

            <h2 className="mt-3 max-w-2xl text-4xl font-black tracking-tight md:text-5xl">
              Run every game from one place.
            </h2>

            <p className="mt-4 max-w-xl text-white/50">
              Manage competitions, teams, players, venues and live matches
              across MIST campus.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/admin/matches/new"
                className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-white/90"
              >
                + Create Match
              </Link>

              <Link
                href="/admin/matches"
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold transition hover:bg-white/10"
              >
                View Matches
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{stat.icon}</span>

                <span className="text-white/20 transition group-hover:text-white/50">
                  →
                </span>
              </div>

              <p className="mt-6 text-3xl font-black">
                {stat.value}
              </p>

              <p className="mt-1 text-sm text-white/40">
                {stat.label}
              </p>
            </Link>
          ))}
        </section>

        {/* Management */}
        <section className="mt-10">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/30">
              Management
            </p>

            <h3 className="mt-2 text-2xl font-black">
              Competition setup
            </h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ManagementCard
              href="/admin/sports"
              icon="🏆"
              title="Sports"
              description="Manage the sports available in the tournament."
            />

            <ManagementCard
              href="/admin/teams"
              icon="👥"
              title="Teams"
              description="Create departments and competition teams."
            />

            <ManagementCard
              href="/admin/players"
              icon="⚡"
              title="Players"
              description="Manage player rosters and jersey numbers."
            />

            <ManagementCard
              href="/admin/venues"
              icon="📍"
              title="Venues"
              description="Manage courts, grounds and match locations."
            />
          </div>
        </section>

        {/* Match Management */}
        <section className="mt-10">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/30">
              Match Operations
            </p>

            <h3 className="mt-2 text-2xl font-black">
              Live competition
            </h3>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <ManagementCard
              href="/admin/matches"
              icon="📅"
              title="Fixtures"
              description="Schedule and manage upcoming matches."
            />

            <ManagementCard
              href="/admin/matches/live"
              icon="🔴"
              title="Live Matches"
              description="Monitor matches currently being scored."
            />

            <ManagementCard
              href="/admin/results"
              icon="🏅"
              title="Results"
              description="Review completed matches and results."
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function ManagementCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-blue-400/30 hover:bg-white/[0.06]"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-xl">
        {icon}
      </div>

      <h4 className="mt-5 text-lg font-bold">
        {title}
      </h4>

      <p className="mt-2 text-sm leading-6 text-white/40">
        {description}
      </p>

      <div className="mt-5 text-sm font-bold text-blue-400">
        Open →
      </div>
    </Link>
  );
}