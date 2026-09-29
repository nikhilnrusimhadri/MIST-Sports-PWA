"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
};

type Venue = {
  id: string;
  name: string;
  location: string | null;
};

type Scorer = {
  id: string;
  full_name: string;
};

export default function CreateMatchPage() {
  const router = useRouter();
  const supabase = createClient();

  const [sports, setSports] = useState<Sport[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [scorers, setScorers] = useState<Scorer[]>([]);

  const [sportId, setSportId] = useState("");
  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [venueId, setVenueId] = useState("");
  const [scorerId, setScorerId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      /*
       * First verify that the browser has an authenticated session.
       */
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      console.log("CREATE MATCH AUTH USER:", user);
      console.log("CREATE MATCH AUTH ERROR:", authError);

      if (authError || !user) {
        setError(
          "Your admin session is not available. Please log out and log in again."
        );
        setLoading(false);
        return;
      }

      /*
       * Load all data required by the form.
       */
      const [
        sportsResult,
        teamsResult,
        venuesResult,
        scorersResult,
      ] = await Promise.all([
        supabase
          .from("sports")
          .select("id,name,icon")
          .order("name"),

        supabase
          .from("teams")
          .select("id,name,department,sport_id")
          .order("name"),

        supabase
          .from("venues")
          .select("id,name,location")
          .order("name"),

        supabase
          .from("profiles")
          .select("id,full_name")
          .eq("role", "scorer")
          .order("full_name"),
      ]);

      if (sportsResult.error) {
        throw new Error(
          `Sports: ${sportsResult.error.message}`
        );
      }

      if (teamsResult.error) {
        throw new Error(
          `Teams: ${teamsResult.error.message}`
        );
      }

      if (venuesResult.error) {
        throw new Error(
          `Venues: ${venuesResult.error.message}`
        );
      }

      if (scorersResult.error) {
        throw new Error(
          `Scorers: ${scorersResult.error.message}`
        );
      }

      setSports(sportsResult.data || []);
      setTeams(teamsResult.data || []);
      setVenues(venuesResult.data || []);
      setScorers(scorersResult.data || []);
    } catch (err) {
      console.error("LOAD MATCH DATA ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load match data."
      );
    } finally {
      setLoading(false);
    }
  }

  const sportTeams = teams.filter(
    (team) => team.sport_id === sportId
  );

  async function handleCreateMatch() {
    setError("");

    /*
     * Validate form.
     */
    if (!sportId) {
      setError("Please select a sport.");
      return;
    }

    if (!teamAId) {
      setError("Please select Team A.");
      return;
    }

    if (!teamBId) {
      setError("Please select Team B.");
      return;
    }

    if (teamAId === teamBId) {
      setError(
        "Team A and Team B must be different."
      );
      return;
    }

    if (!venueId) {
      setError("Please select a venue.");
      return;
    }

    if (!scorerId) {
      setError("Please assign a scorer.");
      return;
    }

    if (!scheduledAt) {
      setError(
        "Please select the match date and time."
      );
      return;
    }

    /*
     * Make sure selected date is valid.
     */
    const scheduledDate = new Date(scheduledAt);

    if (Number.isNaN(scheduledDate.getTime())) {
      setError("Invalid match date or time.");
      return;
    }

    setSaving(true);

    try {
      /*
       * IMPORTANT:
       * Verify the actual browser session.
       */
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      console.log(
        "MATCH CREATE USER:",
        user
      );

      console.log(
        "MATCH CREATE USER ERROR:",
        userError
      );

      if (userError) {
        console.error(
          "AUTH USER ERROR:",
          userError
        );

        setError(
          `Authentication error: ${userError.message}`
        );

        setSaving(false);
        return;
      }

      if (!user) {
        setError(
          "No authenticated Supabase user found. Please log out and log in again."
        );

        setSaving(false);
        return;
      }

      /*
       * Verify that this authenticated user has
       * an admin profile.
       */
      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("id,full_name,role")
        .eq("id", user.id)
        .single();

      console.log(
        "MATCH CREATE PROFILE:",
        profile
      );

      console.log(
        "MATCH CREATE PROFILE ERROR:",
        profileError
      );

      if (profileError) {
        setError(
          `Unable to verify admin profile: ${profileError.message}`
        );

        setSaving(false);
        return;
      }

      if (!profile || profile.role !== "admin") {
        setError(
          "The currently logged-in account is not an admin."
        );

        setSaving(false);
        return;
      }

      /*
       * Prepare match payload.
       */
      const matchPayload = {
        sport_id: sportId,
        team_a_id: teamAId,
        team_b_id: teamBId,
        venue_id: venueId,
        scorer_id: scorerId,
        scheduled_at:
          scheduledDate.toISOString(),
        status: "scheduled" as const,
        score_a: 0,
        score_b: 0,
        sport_data: {},
      };

      console.log(
        "MATCH INSERT PAYLOAD:",
        matchPayload
      );

      /*
       * Insert match.
       */
      const {
        data: createdMatch,
        error: insertError,
      } = await supabase
        .from("matches")
        .insert(matchPayload)
        .select("id")
        .single();

      console.log(
        "MATCH INSERT RESULT:",
        createdMatch
      );

      console.log(
        "MATCH INSERT ERROR:",
        insertError
      );

      if (insertError) {
        console.error(
          "MATCH INSERT FAILED:",
          insertError
        );

        setError(
          `Unable to create match: ${insertError.message}`
        );

        setSaving(false);
        return;
      }

      /*
       * Success.
       */
      console.log(
        "MATCH CREATED SUCCESSFULLY:",
        createdMatch
      );

      router.push("/admin/matches");
      router.refresh();
    } catch (err) {
      console.error(
        "CREATE MATCH UNEXPECTED ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating the match."
      );

      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#05050a] text-white">

        <div className="flex min-h-screen items-center justify-center">

          <div className="text-center">

            <div className="text-5xl">
              🏟️
            </div>

            <p className="mt-4 text-sm text-white/50">
              Loading match setup...
            </p>

          </div>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#05050a] text-white">

      {/* Header */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-xl">

        <div className="mx-auto max-w-4xl px-6 py-5">

          <Link
            href="/admin/matches"
            className="text-sm text-white/40 transition hover:text-white"
          >
            ← Matches
          </Link>

          <h1 className="mt-2 text-3xl font-black">
            Create Match
          </h1>

          <p className="mt-2 text-sm text-white/40">
            Schedule a new tournament fixture.
          </p>

        </div>

      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">

          <div className="grid gap-6">

            {/* Sport */}
            <div>

              <label className="mb-2 block text-sm font-semibold text-white/70">
                Sport
              </label>

              <select
                value={sportId}
                onChange={(event) => {
                  setSportId(event.target.value);
                  setTeamAId("");
                  setTeamBId("");
                }}
                className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-white outline-none transition focus:border-blue-500"
              >

                <option value="">
                  Select sport
                </option>

                {sports.map((sport) => (
                  <option
                    key={sport.id}
                    value={sport.id}
                  >
                    {sport.icon} {sport.name}
                  </option>
                ))}

              </select>

            </div>

            {/* Teams */}
            <div className="grid gap-6 md:grid-cols-2">

              {/* Team A */}
              <div>

                <label className="mb-2 block text-sm font-semibold text-white/70">
                  Team A
                </label>

                <select
                  value={teamAId}
                  onChange={(event) =>
                    setTeamAId(event.target.value)
                  }
                  disabled={!sportId}
                  className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-white outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                >

                  <option value="">
                    Select Team A
                  </option>

                  {sportTeams.map((team) => (
                    <option
                      key={team.id}
                      value={team.id}
                    >
                      {team.name}
                      {team.department
                        ? ` — ${team.department}`
                        : ""}
                    </option>
                  ))}

                </select>

              </div>

              {/* Team B */}
              <div>

                <label className="mb-2 block text-sm font-semibold text-white/70">
                  Team B
                </label>

                <select
                  value={teamBId}
                  onChange={(event) =>
                    setTeamBId(event.target.value)
                  }
                  disabled={!sportId}
                  className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-white outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                >

                  <option value="">
                    Select Team B
                  </option>

                  {sportTeams.map((team) => (
                    <option
                      key={team.id}
                      value={team.id}
                    >
                      {team.name}
                      {team.department
                        ? ` — ${team.department}`
                        : ""}
                    </option>
                  ))}

                </select>

              </div>

            </div>

            {/* Venue */}
            <div>

              <label className="mb-2 block text-sm font-semibold text-white/70">
                Venue
              </label>

              <select
                value={venueId}
                onChange={(event) =>
                  setVenueId(event.target.value)
                }
                className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-white outline-none transition focus:border-blue-500"
              >

                <option value="">
                  Select venue
                </option>

                {venues.map((venue) => (
                  <option
                    key={venue.id}
                    value={venue.id}
                  >
                    {venue.name}
                    {venue.location
                      ? ` — ${venue.location}`
                      : ""}
                  </option>
                ))}

              </select>

            </div>

            {/* Scorer */}
            <div>

              <label className="mb-2 block text-sm font-semibold text-white/70">
                Match Scorer
              </label>

              <select
                value={scorerId}
                onChange={(event) =>
                  setScorerId(event.target.value)
                }
                className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-white outline-none transition focus:border-blue-500"
              >

                <option value="">
                  Assign scorer
                </option>

                {scorers.map((scorer) => (
                  <option
                    key={scorer.id}
                    value={scorer.id}
                  >
                    {scorer.full_name}
                  </option>
                ))}

              </select>

            </div>

            {/* Date */}
            <div>

              <label className="mb-2 block text-sm font-semibold text-white/70">
                Date & Time
              </label>

              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) =>
                  setScheduledAt(event.target.value)
                }
                className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-white outline-none transition focus:border-blue-500"
              />

            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">

                <p className="text-sm font-semibold text-red-300">
                  {error}
                </p>

                <p className="mt-2 text-xs text-red-300/60">
                  Open browser DevTools → Console for additional
                  authentication diagnostics.
                </p>

              </div>
            )}

            {/* Create */}
            <button
              type="button"
              onClick={handleCreateMatch}
              disabled={saving}
              className="mt-2 h-13 w-full rounded-xl bg-white px-6 font-bold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Creating Match..."
                : "Create Match"}
            </button>

          </div>

        </div>

      </div>

    </main>
  );
}