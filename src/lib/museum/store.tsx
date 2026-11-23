import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { z } from "zod";
import { MUSEUMS, type Booking } from "./catalog";
import { cancelBooking, createBooking, type BookingInput, type CreateResult } from "./booking";

const STORAGE_KEY = "museumpass:bookings:v1";

interface State {
  bookings: Booking[];
  hydrated: boolean;
}

type Action =
  | { type: "hydrate"; bookings: Booking[] }
  | { type: "replace"; bookings: Booking[] }
  | { type: "cancel"; id: string };

export function bookingsReducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { bookings: action.bookings, hydrated: true };
    case "replace":
      return { ...state, bookings: action.bookings };
    case "cancel":
      return { ...state, bookings: cancelBooking(state.bookings, action.id) };
  }
}

const storedBooking = z.object({
  id: z.string(),
  museumId: z.string(),
  date: z.string(),
  time: z.string(),
  visitorName: z.string(),
  quantity: z.number(),
  totalPrice: z.number(),
  createdAt: z.string(),
  status: z.enum(["active", "cancelled"]),
});

function loadBookings(): Booking[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = z.array(storedBooking).safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

interface BookingsContextValue {
  bookings: Booking[];
  hydrated: boolean;
  book: (input: BookingInput) => CreateResult;
  cancel: (id: string) => void;
}

const BookingsContext = createContext<BookingsContextValue | null>(null);

export function BookingsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookingsReducer, { bookings: [], hydrated: false });

  useEffect(() => {
    dispatch({ type: "hydrate", bookings: loadBookings() });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.bookings));
  }, [state]);

  const book = useCallback(
    (input: BookingInput) => {
      const result = createBooking(state.bookings, input, MUSEUMS, new Date(), crypto.randomUUID());
      if (result.ok) dispatch({ type: "replace", bookings: result.bookings });
      return result;
    },
    [state.bookings],
  );

  const cancel = useCallback((id: string) => dispatch({ type: "cancel", id }), []);

  const value = useMemo(
    () => ({ bookings: state.bookings, hydrated: state.hydrated, book, cancel }),
    [state, book, cancel],
  );

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
}

export function useBookings() {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error("useBookings must be used inside BookingsProvider");
  return ctx;
}

/** Current time, available only after hydration so server and browser render the same markup. */
export function useNow(refreshMs = 60_000) {
  const [now, setNow] = useReducer((_: Date | null, next: Date) => next, null);
  useEffect(() => {
    setNow(new Date());
    const t = window.setInterval(() => setNow(new Date()), refreshMs);
    return () => window.clearInterval(t);
  }, [refreshMs]);
  return now;
}
