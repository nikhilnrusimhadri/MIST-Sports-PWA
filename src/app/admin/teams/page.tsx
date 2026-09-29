"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Sport = {
  id: string;
  name: string;
  icon: string | null;
};

type Team = {
  id: string;
  name: string;
  department: string | null;
  sport_id: string;
  sports: Sport | Sport[] | null;
};

export default function TeamsPage() {
  const supabase = createClient();

  const [sports, setSports] = useState<Sport[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [sportId, setSportId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    const [sportsResult, teamsResult] = await Promise.all([
      supabase
        .from("sports")
        .select("id,name,icon")
        .order("name"),

      supabase
        .from("teams")
        .select(`
          id,
          name,
          department,
          sport_id,
          sports (
            id,
            name,
            icon
          )
        `)
        .order("name"),
    ]);

    if (sportsResult.error) {
      setError(sportsResult.error.message);
    } else if (teamsResult.error) {
      setError(teamsResult.error.message);
    } else {
      setSports(sportsResult.data || []);
      setTeams(teamsResult.data || []);
    }

    setLoading(false);
  }

  async function createTeam() {
    setError("");

    if (!name.trim()) {
      setError("Enter a team name.");
      return;
    }

    if (!department.trim()) {
      setError("Enter a department.");
      return;
    }

    if (!sportId) {
      setError("Select a sport.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("teams")
      .insert({
        name: name.trim(),
        department: department.trim(),
        sport_id: sportId,
      });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setName("");
    setDepartment("");
    setSportId("");

    await loadData();

    setSaving(false);
  }

  async function deleteTeam(teamId: string) {
    const confirmed = window.confirm(
      "Delete this team? Players and related matches may also be affected."
    );

    if (!confirmed) return;

    setError("");

    const { error } = await supabase
      .from("teams")
      .delete()
      .eq("id", teamId);

    if (error) {
      setError(error.message);
      return;
    }

    await loadData();
  }

  return (
    <main className="min-h-screen bg-[#05050a] text-white">

      {/* Header */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 py-5">

          <Link
            href="/admin"
            className="text-sm text-white/40 hover:text-white"
          >
            ← Control Center
          </Link>

          <h1 className="mt-2 text-3xl font-black">
            Teams
          </h1>

          <p className="mt-2 text-sm text-white/40">
            Create and manage teams participating in MIST Sports.
          </p>

        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">

        {/* Create */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">

          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
              Team Management
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Create Team
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">

            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-white/70">
                Team Name
              </label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Example: CSE Warriors"
                className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-white outline-none placeholder:text-white/20 focus:border-blue-500"
              />
            </div>

            {/* Department */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-white/70">
                Department
              </label>

              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Example: CSE"
                className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-white outline-none placeholder:text-white/20 focus:border-blue-500"
              />
            </div>

            {/* Sport */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-white/70">
                Sport
              </label>

              <select
                value={sportId}
                onChange={(e) => setSportId(e.target.value)}
                className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-white outline-none focus:border-blue-500"
              >
                <option value="">
                  Select sport
                </option>

                {sports.map((sport) => (
                  <option key={sport.id} value={sport.id}>
                    {sport.icon} {sport.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            onClick={createTeam}
            disabled={saving}
            className="mt-6 rounded-xl bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-white/90 disabled:opacity-50"
          >
            {saving ? "Creating..." : "+ Create Team"}
          </button>

        </section>

        {/* Existing teams */}
        <section className="mt-10">

          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/30">
              Competition Teams
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Existing Teams
            </h2>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/10 p-10 text-center text-white/40">
              Loading teams...
            </div>
          ) : teams.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">

              <div className="text-4xl">
                👥
              </div>

              <p className="mt-4 font-semibold">
                No teams created yet
              </p>

              <p className="mt-2 text-sm text-white/40">
                Create your first tournament team above.
              </p>

            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">

              {teams.map((team) => {

                const sport = Array.isArray(team.sports)
                  ? team.sports[0]
                  : team.sports;

                return (
                  <div
                    key={team.id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                  >

                    <div className="flex items-center gap-4">

                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-xl">
                        {sport?.icon || "👥"}
                      </div>

                      <div>
                        <h3 className="font-bold">
                          {team.name}
                        </h3>

                        <p className="mt-1 text-sm text-white/40">
                          {team.department}
                        </p>

                        <p className="mt-1 text-xs text-blue-400">
                          {sport?.name || "Unknown sport"}
                        </p>
                      </div>

                    </div>

                    <button
                      onClick={() => deleteTeam(team.id)}
                      className="rounded-lg border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10"
                    >
                      Delete
                    </button>

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