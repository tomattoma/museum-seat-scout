import { z } from "zod";
import type { Booking, Museum } from "./catalog";

export const MIN_TICKETS = 1;
export const MAX_TICKETS = 10;
export const BOOKABLE_DAYS = 7;

/** Seats held by active bookings for one museum slot on one date. */
export function bookedSeats(bookings: Booking[], museumId: string, date: string, time: string) {
  return bookings
    .filter(
      (b) => b.status === "active" && b.museumId === museumId && b.date === date && b.time === time,
    )
    .reduce((sum, b) => sum + b.quantity, 0);
}

export function remainingSeats(museum: Museum, date: string, time: string, bookings: Booking[]) {
  const slot = museum.slots.find((s) => s.time === time);
  if (!slot) return 0;
  return Math.max(0, slot.capacity - slot.taken - bookedSeats(bookings, museum.id, date, time));
}

export function remainingForDay(museum: Museum, date: string, bookings: Booking[]) {
  return museum.slots.reduce((sum, s) => sum + remainingSeats(museum, date, s.time, bookings), 0);
}

/** Local calendar date as YYYY-MM-DD. */
export function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function upcomingDates(now: Date, days = BOOKABLE_DAYS) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    return toDateKey(d);
  });
}

export function slotStart(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

export function isSlotPast(date: string, time: string, now: Date) {
  return slotStart(date, time).getTime() <= now.getTime();
}

export const bookingInputSchema = z.object({
  museumId: z.string().min(1, "Choose a museum"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a visit date"),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a time slot"),
  visitorName: z
    .string()
    .trim()
    .min(2, "Enter the visitor's name (at least 2 characters)")
    .max(60, "Name must be 60 characters or fewer"),
  quantity: z
    .number({ invalid_type_error: "Enter how many tickets you need" })
    .int("Tickets must be a whole number")
    .min(MIN_TICKETS, `Book at least ${MIN_TICKETS} ticket`)
    .max(MAX_TICKETS, `You can book up to ${MAX_TICKETS} tickets at a time`),
});

export type BookingInput = z.input<typeof bookingInputSchema>;
export type BookingField = keyof BookingInput;
export type BookingErrors = Partial<Record<BookingField | "form", string | undefined>>;

export type ValidationResult =
  | { ok: true; value: z.output<typeof bookingInputSchema>; museum: Museum; remaining: number }
  | { ok: false; errors: BookingErrors };

export function validateBooking(
  input: BookingInput,
  museums: Museum[],
  bookings: Booking[],
  now: Date,
): ValidationResult {
  const parsed = bookingInputSchema.safeParse(input);
  const errors: BookingErrors = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as BookingField | undefined;
      if (field && !errors[field]) errors[field] = issue.message;
    }
    return { ok: false, errors };
  }
  const value = parsed.data;
  const museum = museums.find((m) => m.id === value.museumId);
  if (!museum) return { ok: false, errors: { museumId: "Choose a museum from the list" } };

  const allowedDates = upcomingDates(now);
  if (!allowedDates.includes(value.date)) {
    return { ok: false, errors: { date: `Choose a date within the next ${BOOKABLE_DAYS} days` } };
  }
  if (!museum.slots.some((s) => s.time === value.time)) {
    return { ok: false, errors: { time: "Choose one of this museum's time slots" } };
  }
  if (isSlotPast(value.date, value.time, now)) {
    return { ok: false, errors: { time: "This time slot has already started" } };
  }
  const remaining = remainingSeats(museum, value.date, value.time, bookings);
  if (remaining === 0) return { ok: false, errors: { time: "This time slot is sold out" } };
  if (value.quantity > remaining) {
    return {
      ok: false,
      errors: {
        quantity: `Only ${remaining} ${remaining === 1 ? "seat is" : "seats are"} left for this slot`,
      },
    };
  }
  return { ok: true, value, museum, remaining };
}

export type CreateResult =
  | { ok: true; booking: Booking; bookings: Booking[] }
  | { ok: false; errors: BookingErrors };

export function createBooking(
  bookings: Booking[],
  input: BookingInput,
  museums: Museum[],
  now: Date,
  id: string,
): CreateResult {
  const result = validateBooking(input, museums, bookings, now);
  if (!result.ok) return result;
  const { value, museum } = result;
  const booking: Booking = {
    id,
    museumId: museum.id,
    date: value.date,
    time: value.time,
    visitorName: value.visitorName,
    quantity: value.quantity,
    totalPrice: museum.price * value.quantity,
    createdAt: now.toISOString(),
    status: "active",
  };
  return { ok: true, booking, bookings: [booking, ...bookings] };
}

/** Marks a booking cancelled; its seats count as available again. */
export function cancelBooking(bookings: Booking[], id: string): Booking[] {
  return bookings.map((b) =>
    b.id === id && b.status === "active" ? { ...b, status: "cancelled" as const } : b,
  );
}

export function allCategories(museums: Museum[]) {
  return Array.from(new Set(museums.flatMap((m) => m.tags))).sort((a, b) => a.localeCompare(b));
}

export function filterMuseums(museums: Museum[], query: string, category: string | null) {
  const q = query.trim().toLowerCase();
  return museums.filter((m) => {
    if (category && !m.tags.includes(category)) return false;
    if (!q) return true;
    return [m.name, m.district, m.exhibition, m.description, ...m.tags].some((field) =>
      field.toLowerCase().includes(q),
    );
  });
}

export const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

export function formatDateLabel(date: string, opts: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...opts,
  }).format(new Date(`${date}T00:00:00`));
}
