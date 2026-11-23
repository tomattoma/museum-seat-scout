import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MUSEUMS } from "@/lib/museum/catalog";
import { allCategories, filterMuseums, formatDateLabel, toDateKey, upcomingDates } from "@/lib/museum/booking";
import { useBookings, useNow } from "@/lib/museum/store";
import { MuseumCard } from "@/components/museum/MuseumCard";
import { BookingDialog, type BookingPreset } from "@/components/museum/BookingDialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MuseumPass — Browse museums & book visit slots" },
      {
        name: "description",
        content: "Search museums by category, see live seat availability and book a timed visit.",
      },
      { property: "og:title", content: "MuseumPass — Browse museums & book visit slots" },
      {
        property: "og:description",
        content: "Search museums by category, see live seat availability and book a timed visit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const CATEGORIES = allCategories(MUSEUMS);

function Index() {
  const now = useNow();
  const { bookings } = useBookings();
  const todayKey = now ? toDateKey(now) : null;
  const dates = useMemo(() => (todayKey ? upcomingDates(new Date(`${todayKey}T00:00:00`)) : []), [todayKey]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const date = pickedDate && dates.includes(pickedDate) ? pickedDate : (dates[0] ?? null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [preset, setPreset] = useState<BookingPreset>({ museumId: "", date: "", time: "" });

  const results = filterMuseums(MUSEUMS, query, category);

  const openBooking = (museumId: string, time?: string) => {
    setPreset({ museumId, date: date ?? "", time: time ?? "" });
    setDialogOpen(true);
  };

  return (
    <>
      <section className="pb-10 pt-14 sm:pt-20">
        <p className="eyebrow">{MUSEUMS.length} museums · one pass</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-medium leading-[1.05] sm:text-6xl">
          Plan your next <em className="text-primary">museum visit</em>.
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Find an exhibition, pick a time slot and reserve up to {10} tickets in seconds.
        </p>
      </section>

      <section aria-label="Filters" className="space-y-4 border-y py-5">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search museums, exhibitions, districts…"
            aria-label="Search museums"
            className="h-11 bg-card pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Category">
          <span className="eyebrow mr-1">Category</span>
          <button type="button" className="chip" data-active={category === null} onClick={() => setCategory(null)}>
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className="chip"
              data-active={category === c}
              aria-pressed={category === c}
              onClick={() => setCategory(category === c ? null : c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Visit date">
          <span className="eyebrow mr-1">Visit date</span>
          {dates.length === 0 && <span className="text-sm text-muted-foreground">Loading dates…</span>}
          {dates.map((d, i) => (
            <button
              key={d}
              type="button"
              className="chip"
              data-active={d === date}
              aria-pressed={d === date}
              onClick={() => setPickedDate(d)}
            >
              {i === 0 ? "Today" : formatDateLabel(d)}
            </button>
          ))}
        </div>
      </section>

      <p className="mb-4 mt-8 text-sm text-muted-foreground">
        {results.length} {results.length === 1 ? "museum" : "museums"}
        {date && <> · seats shown for {formatDateLabel(date, { weekday: "long" })}</>}
      </p>

      {results.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="font-display text-xl">No museums match your search.</p>
          <button
            type="button"
            className="mt-3 text-sm font-medium text-primary underline-offset-4 hover:underline"
            onClick={() => {
              setQuery("");
              setCategory(null);
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {results.map((m) => (
            <MuseumCard key={m.id} museum={m} date={date} now={now} bookings={bookings} onBook={openBooking} />
          ))}
        </div>
      )}

      <BookingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        preset={preset}
        dates={dates}
        now={now}
      />
    </>
  );
}
