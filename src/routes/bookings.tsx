import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Clock, Ticket, User } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MUSEUMS, type Booking } from "@/lib/museum/catalog";
import { formatDateLabel, formatPrice } from "@/lib/museum/booking";
import { useBookings } from "@/lib/museum/store";
import { toneBg } from "@/components/museum/tones";

export const Route = createFileRoute("/bookings")({
  head: () => ({
    meta: [
      { title: "My Bookings — MuseumPass" },
      { name: "description", content: "Review and cancel your museum visit bookings." },
      { property: "og:title", content: "My Bookings — MuseumPass" },
      { property: "og:description", content: "Review and cancel your museum visit bookings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BookingsPage,
});

const byVisit = (a: Booking, b: Booking) =>
  `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);

function BookingsPage() {
  const { bookings, hydrated, cancel } = useBookings();
  const active = bookings.filter((b) => b.status === "active").sort(byVisit);
  const cancelled = bookings.filter((b) => b.status === "cancelled").sort(byVisit);
  const tickets = active.reduce((s, b) => s + b.quantity, 0);

  return (
    <>
      <section className="pb-8 pt-14 sm:pt-20">
        <p className="eyebrow">Your visits</p>
        <h1 className="mt-3 text-4xl font-medium sm:text-5xl">My Bookings</h1>
        {hydrated && active.length > 0 && (
          <p className="mt-3 text-muted-foreground">
            {active.length} upcoming {active.length === 1 ? "visit" : "visits"} · {tickets}{" "}
            {tickets === 1 ? "ticket" : "tickets"}
          </p>
        )}
      </section>

      {!hydrated ? (
        <p className="text-muted-foreground">Loading your bookings…</p>
      ) : bookings.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Ticket className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-display text-xl">No bookings yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">Pick a museum and reserve a time slot.</p>
          <Button asChild className="mt-5">
            <Link to="/">Browse museums</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          <ul className="space-y-4">
            {active.map((b) => (
              <BookingRow key={b.id} booking={b} onCancel={() => {
                cancel(b.id);
                toast("Booking cancelled", { description: `${b.quantity} seats released.` });
              }} />
            ))}
            {active.length === 0 && (
              <li className="text-muted-foreground">No upcoming visits.</li>
            )}
          </ul>

          {cancelled.length > 0 && (
            <section>
              <h2 className="eyebrow mb-3 font-sans">Cancelled</h2>
              <ul className="space-y-3">
                {cancelled.map((b) => (
                  <BookingRow key={b.id} booking={b} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </>
  );
}

function BookingRow({ booking, onCancel }: { booking: Booking; onCancel?: () => void }) {
  const museum = MUSEUMS.find((m) => m.id === booking.museumId);
  const isCancelled = booking.status === "cancelled";

  return (
    <li
      className={`flex overflow-hidden rounded-xl border bg-card shadow-card ${isCancelled ? "opacity-60" : ""}`}
    >
      <div className={`w-1.5 shrink-0 ${museum ? toneBg[museum.tone] : "bg-muted"}`} />
      <div className="flex flex-1 flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h3 className={`text-xl font-medium ${isCancelled ? "line-through" : ""}`}>
            {museum?.name ?? "Unknown museum"}
          </h3>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" /> {formatDateLabel(booking.date, { weekday: "long" })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" /> {booking.time}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="size-4" /> {booking.visitorName}
            </span>
            <span className="flex items-center gap-1.5">
              <Ticket className="size-4" /> {booking.quantity}{" "}
              {booking.quantity === 1 ? "ticket" : "tickets"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
          <span className="font-display text-xl">{formatPrice(booking.totalPrice)}</span>
          {onCancel && !isCancelled ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Cancel booking
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {booking.quantity} {booking.quantity === 1 ? "seat" : "seats"} at {museum?.name} on{" "}
                    {formatDateLabel(booking.date)} at {booking.time} will be released.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep booking</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={onCancel}
                  >
                    Cancel booking
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Cancelled
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
