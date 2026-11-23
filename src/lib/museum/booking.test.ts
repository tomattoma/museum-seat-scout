import { describe, expect, it } from "vitest";
import type { Booking, Museum } from "./catalog";
import { MUSEUMS } from "./catalog";
import {
  cancelBooking,
  createBooking,
  filterMuseums,
  remainingSeats,
  toDateKey,
  validateBooking,
} from "./booking";
import { bookingsReducer } from "./store";

// Fixed "now": 08:00 local time, so every slot later that day is bookable.
const now = new Date(2026, 10, 23, 8, 0);
const today = toDateKey(now);

const gallery: Museum = {
  id: "test-gallery",
  name: "Test Gallery",
  district: "Centre",
  exhibition: "Test Show",
  description: "",
  tags: ["Fine Art"],
  price: 15,
  tone: "ink",
  slots: [
    { time: "10:00", capacity: 20, taken: 5 }, // 15 free
    { time: "12:00", capacity: 10, taken: 7 }, // 3 free
    { time: "14:00", capacity: 10, taken: 10 }, // sold out
  ],
};

const base = { museumId: gallery.id, date: today, time: "10:00", visitorName: "Alex Demo" };

describe("ticket quantity", () => {
  it("rejects 0 tickets", () => {
    const r = validateBooking({ ...base, quantity: 0 }, [gallery], [], now);
    expect(r.ok).toBe(false);
  });

  it("rejects 11 tickets", () => {
    const r = validateBooking({ ...base, quantity: 11 }, [gallery], [], now);
    expect(r.ok ? null : r.errors.quantity).toBe("You can book up to 10 tickets at a time");
  });

  it("accepts 10 tickets when enough seats remain", () => {
    expect(validateBooking({ ...base, quantity: 10 }, [gallery], [], now).ok).toBe(true);
  });
});

describe("seat availability", () => {
  it("prevents booking more tickets than remaining seats", () => {
    const r = validateBooking({ ...base, time: "12:00", quantity: 4 }, [gallery], [], now);
    expect(r.ok ? null : r.errors.quantity).toBe("Only 3 seats are left for this slot");
  });

  it("rejects a sold-out slot", () => {
    const r = validateBooking({ ...base, time: "14:00", quantity: 1 }, [gallery], [], now);
    expect(r.ok ? null : r.errors.time).toBe("This time slot is sold out");
  });

  it("rejects a slot that has already started", () => {
    const late = new Date(2026, 10, 23, 10, 30);
    const r = validateBooking({ ...base, quantity: 1 }, [gallery], [], late);
    expect(r.ok).toBe(false);
  });

  it("requires a visitor name", () => {
    const r = validateBooking({ ...base, visitorName: "  ", quantity: 1 }, [gallery], [], now);
    expect(r.ok ? null : r.errors.visitorName).toBeTruthy();
  });

  it("booking reduces remaining seats and cancelling restores them", () => {
    const created = createBooking([], { ...base, quantity: 4 }, [gallery], now, "b1");
    if (!created.ok) throw new Error("expected booking to succeed");
    expect(created.booking.totalPrice).toBe(60);
    expect(remainingSeats(gallery, today, "10:00", created.bookings)).toBe(11);

    const after = cancelBooking(created.bookings, "b1");
    expect(after[0]?.status).toBe("cancelled");
    expect(remainingSeats(gallery, today, "10:00", after)).toBe(15);
  });

  it("second booking cannot exceed seats left by the first", () => {
    const first = createBooking([], { ...base, time: "12:00", quantity: 2 }, [gallery], now, "a");
    if (!first.ok) throw new Error("expected booking to succeed");
    const second = createBooking(first.bookings, { ...base, time: "12:00", quantity: 2 }, [gallery], now, "b");
    expect(second.ok).toBe(false);
  });

  it("reducer cancel action restores seats", () => {
    const booking: Booking = {
      id: "x", museumId: gallery.id, date: today, time: "12:00", visitorName: "A B",
      quantity: 3, totalPrice: 45, createdAt: now.toISOString(), status: "active",
    };
    const state = bookingsReducer({ bookings: [booking], hydrated: true }, { type: "cancel", id: "x" });
    expect(remainingSeats(gallery, today, "12:00", state.bookings)).toBe(3);
  });
});

describe("search and category filter", () => {
  it("filters by category", () => {
    const ids = filterMuseums(MUSEUMS, "", "Family").map((m) => m.id);
    expect(ids).toEqual(["halden-natural-history", "old-harbor-maritime", "kinetic-science"]);
  });

  it("searches by name, case-insensitively", () => {
    expect(filterMuseums(MUSEUMS, "LUMEN", null).map((m) => m.id)).toEqual(["lumen-photography"]);
  });

  it("combines search and category", () => {
    expect(filterMuseums(MUSEUMS, "harbour", "Science")).toHaveLength(0);
  });
});
