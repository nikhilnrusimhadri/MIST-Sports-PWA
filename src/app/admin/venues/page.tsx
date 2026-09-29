"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Venue = {
  id: string;
  name: string;
  location: string | null;
};

export default function VenuesPage() {
  const supabase = createClient();

  const [venues, setVenues] = useState<Venue[]>([]);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadVenues();
  }, []);

  async function loadVenues() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("venues")
      .select("id,name,location")
      .order("name");

    if (error) {
      setError(error.message);
    } else {
      setVenues(data || []);
    }

    setLoading(false);
  }

  async function createVenue() {
    setError("");

    if (!name.trim()) {
      setError("Enter a venue name.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("venues")
      .insert({
        name: name.trim(),
        location: location.trim() || null,
      });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setName("");
    setLocation("");

    await loadVenues();
    setSaving(false);
  }

  async function deleteVenue(id: string) {
    const confirmed = window.confirm(
      "Delete this venue?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("venues")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    await loadVenues();
  }

  return (
    <main className="min-h-screen bg-[#05050a] text-white">

      <header className="border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 py-5">

          <Link
            href="/admin"
            className="text-sm text-white/40 hover:text-white"
          >
            ← Control Center
          </Link>

          <h1 className="mt-2 text-3xl font-black">
            Venues
          </h1>

          <p className="mt-2 text-sm text-white/40">
            Manage courts, grounds and match locations.
          </p>

        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">

        {/* Create Venue */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">

          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
            Venue Management
          </p>

          <h2 className="mt-2 text-2xl font-black">
            Add Venue
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-semibold text-white/70">
                Venue Name
              </label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Example: Main Volleyball Court"
                className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-white outline-none placeholder:text-white/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-white/70">
                Location / Description
              </label>

              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Example: Near Block A"
                className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-white outline-none placeholder:text-white/20 focus:border-blue-500"
              />
            </div>

          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            onClick={createVenue}
            disabled={saving}
            className="mt-6 rounded-xl bg-white px-6 py-3 text-sm font-bold text-black hover:bg-white/90 disabled:opacity-50"
          >
            {saving ? "Adding..." : "+ Add Venue"}
          </button>

        </section>

        {/* Existing Venues */}
        <section className="mt-10">

          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/30">
              Tournament Locations
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Existing Venues
            </h2>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/10 p-10 text-center text-white/40">
              Loading venues...
            </div>
          ) : venues.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">

              <div className="text-4xl">
                📍
              </div>

              <p className="mt-4 font-semibold">
                No venues created yet
              </p>

            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">

              {venues.map((venue) => (
                <div
                  key={venue.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >

                  <div className="flex items-center gap-4">

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-xl">
                      📍
                    </div>

                    <div>
                      <h3 className="font-bold">
                        {venue.name}
                      </h3>

                      {venue.location && (
                        <p className="mt-1 text-sm text-white/40">
                          {venue.location}
                        </p>
                      )}
                    </div>

                  </div>

                  <button
                    onClick={() => deleteVenue(venue.id)}
                    className="rounded-lg border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10"
                  >
                    Delete
                  </button>

                </div>
              ))}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}