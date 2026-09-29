"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Team = {
  id: string;
  name: string;
  department: string | null;
};

type Player = {
  id: string;
  name: string;
  jersey_number: number | null;
  photo_url: string | null;
  team_id: string;
  teams: Team | Team[] | null;
};

export default function PlayersPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  const [name, setName] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [teamId, setTeamId] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function loadData() {
    setLoading(true);
    setError("");

    const [teamsResult, playersResult] = await Promise.all([
      supabase
        .from("teams")
        .select("id,name,department")
        .order("name"),

      supabase
        .from("players")
        .select(`
          id,
          name,
          jersey_number,
          photo_url,
          team_id,
          teams (
            id,
            name,
            department
          )
        `)
        .order("name"),
    ]);

    if (teamsResult.error) {
      setError(teamsResult.error.message);
    } else if (playersResult.error) {
      setError(playersResult.error.message);
    } else {
      setTeams(teamsResult.data || []);
      setPlayers(playersResult.data || []);
    }

    setLoading(false);
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setError("");

    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setError("Image must be smaller than 5 MB.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function removeSelectedPhoto() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function uploadPlayerPhoto(
    file: File,
    playerId: string
  ) {
    setUploading(true);

    const extension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const filePath = `${playerId}-${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("player-photos")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      setUploading(false);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("player-photos")
      .getPublicUrl(filePath);

    setUploading(false);

    return data.publicUrl;
  }

  async function createPlayer() {
    setError("");

    if (!name.trim()) {
      setError("Enter the player's name.");
      return;
    }

    if (!teamId) {
      setError("Select a team.");
      return;
    }

    let jersey: number | null = null;

    if (jerseyNumber.trim()) {
      jersey = Number(jerseyNumber);

      if (!Number.isInteger(jersey) || jersey < 0) {
        setError("Jersey number must be a valid number.");
        return;
      }
    }

    setSaving(true);

    try {
      /*
       * Create the player first so we have a player ID.
       */
      const { data: player, error: playerError } =
        await supabase
          .from("players")
          .insert({
            name: name.trim(),
            jersey_number: jersey,
            team_id: teamId,
            photo_url: null,
          })
          .select("id")
          .single();

      if (playerError || !player) {
        throw playerError || new Error("Unable to create player.");
      }

      /*
       * Upload photo if one was selected.
       */
      if (selectedFile) {
        const photoUrl = await uploadPlayerPhoto(
          selectedFile,
          player.id
        );

        const { error: updateError } = await supabase
          .from("players")
          .update({
            photo_url: photoUrl,
          })
          .eq("id", player.id);

        if (updateError) {
          throw updateError;
        }
      }

      setName("");
      setJerseyNumber("");
      setTeamId("");

      removeSelectedPhoto();

      await loadData();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong.";

      setError(message);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  async function deletePlayer(id: string) {
    const confirmed = window.confirm(
      "Delete this player from the roster?"
    );

    if (!confirmed) return;

    setError("");

    const { error } = await supabase
      .from("players")
      .delete()
      .eq("id", id);

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
            Players
          </h1>

          <p className="mt-2 text-sm text-white/40">
            Build and manage tournament rosters.
          </p>

        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">

        {/* Add Player */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">

          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
            Roster Management
          </p>

          <h2 className="mt-2 text-2xl font-black">
            Add Player
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">

            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-white/70">
                Player Name
              </label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Example: Rahul Kumar"
                className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-white outline-none placeholder:text-white/20 focus:border-blue-500"
              />
            </div>

            {/* Jersey */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-white/70">
                Jersey Number
              </label>

              <input
                type="number"
                min="0"
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(e.target.value)}
                placeholder="Example: 10"
                className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-white outline-none placeholder:text-white/20 focus:border-blue-500"
              />
            </div>

            {/* Team */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-white/70">
                Team
              </label>

              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-white outline-none focus:border-blue-500"
              >
                <option value="">
                  Select team
                </option>

                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                    {team.department
                      ? ` — ${team.department}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-white/70">
                Player Photo
                <span className="ml-2 text-xs font-normal text-white/30">
                  optional
                </span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              {!selectedFile ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-black/40 px-4 text-sm font-semibold text-white/70 transition hover:border-blue-500 hover:bg-white/5"
                >
                  📷 Choose Photo
                </button>
              ) : (
                <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-black/40 p-3">

                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-14 w-14 rounded-lg object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {selectedFile.name}
                    </p>

                    <p className="text-xs text-white/40">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={removeSelectedPhoto}
                    className="rounded-lg px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10"
                  >
                    Remove
                  </button>

                </div>
              )}

              <p className="mt-2 text-xs text-white/30">
                JPG, PNG or WebP • Maximum 5 MB
              </p>
            </div>

          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={createPlayer}
            disabled={saving}
            className="mt-6 rounded-xl bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading
              ? "Uploading Photo..."
              : saving
                ? "Adding Player..."
                : "+ Add Player"}
          </button>

        </section>

        {/* Player List */}
        <section className="mt-10">

          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/30">
              Tournament Rosters
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Players
            </h2>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/10 p-10 text-center text-white/40">
              Loading players...
            </div>
          ) : players.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">

              <div className="text-4xl">
                ⚡
              </div>

              <p className="mt-4 font-semibold">
                No players added yet
              </p>

              <p className="mt-2 text-sm text-white/40">
                Add players to your tournament teams above.
              </p>

            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">

              {players.map((player) => {

                const team = Array.isArray(player.teams)
                  ? player.teams[0]
                  : player.teams;

                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                  >

                    <div className="flex items-center gap-4">

                      {player.photo_url ? (
                        <img
                          src={player.photo_url}
                          alt={player.name}
                          className="h-14 w-14 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-lg font-black">
                          {player.jersey_number ?? "•"}
                        </div>
                      )}

                      <div>
                        <h3 className="font-bold">
                          {player.name}
                        </h3>

                        <p className="mt-1 text-sm text-white/40">
                          {team?.name || "Unknown team"}
                        </p>

                        <p className="mt-1 text-xs text-blue-400">
                          {player.jersey_number !== null
                            ? `Jersey #${player.jersey_number}`
                            : "No jersey number"}
                        </p>
                      </div>

                    </div>

                    <button
                      onClick={() => deletePlayer(player.id)}
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