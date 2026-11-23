import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Booking, Museum } from "@/lib/museum/catalog";
import { formatPrice, isSlotPast, remainingForDay, remainingSeats } from "@/lib/museum/booking";
import { toneBg } from "./tones";

interface Props {
  museum: Museum;
  date: string | null;
  now: Date | null;
  bookings: Booking[];
  onBook: (museumId: string, time?: string) => void;
}

export function MuseumCard({ museum, date, now, bookings, onBook }: Props) {
  const dayLeft = date ? remainingForDay(museum, date, bookings) : null;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-card">
      <div className={`h-1.5 ${toneBg[museum.tone]}`} />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <header className="space-y-1.5">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-2xl font-medium leading-tight">{museum.name}</h2>
            <p className="shrink-0 text-right">
              <span className="font-display text-xl">{formatPrice(museum.price)}</span>
              <span className="block text-xs text-muted-foreground">per ticket</span>
            </p>
          </div>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" /> {museum.district}
          </p>
        </header>

        <div>
          <p className="eyebrow">Now showing</p>
          <p className="mt-1 font-display text-lg italic">{museum.exhibition}</p>
          <p className="mt-1 text-sm text-muted-foreground">{museum.description}</p>
        </div>

        <ul className="flex flex-wrap gap-1.5" aria-label="Categories">
          {museum.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-sm bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
            >
              {tag}
            </li>
          ))}
        </ul>

        <div className="mt-auto space-y-2">
          <p className="eyebrow">Time slots</p>
          <div className="flex flex-wrap gap-2">
            {museum.slots.map((slot) => {
              const left = date ? remainingSeats(museum, date, slot.time, bookings) : null;
              const past = date && now ? isSlotPast(date, slot.time, now) : false;
              const unavailable = past || left === 0;
              return (
                <button
                  key={slot.time}
                  type="button"
                  className="chip"
                  disabled={unavailable}
                  onClick={() => onBook(museum.id, slot.time)}
                  aria-label={`Book ${slot.time}`}
                >
                  <span className="font-semibold">{slot.time}</span>
                  <span className="text-xs text-muted-foreground">
                    {left === null ? "…" : past ? "passed" : left === 0 ? "sold out" : `${left} left`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <footer className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-muted-foreground">
            {dayLeft === null ? (
              "Checking seats…"
            ) : (
              <>
                <span className="font-semibold text-foreground">{dayLeft}</span> seats left this day
              </>
            )}
          </p>
          <Button onClick={() => onBook(museum.id)} disabled={dayLeft === 0}>
            Book visit
          </Button>
        </footer>
      </div>
    </article>
  );
}
