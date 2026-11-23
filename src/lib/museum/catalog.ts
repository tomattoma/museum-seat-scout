export type Tone = "oxblood" | "ochre" | "sage" | "ink" | "slate";

export interface TimeSlot {
  /** Local start time, 24-hour HH:mm. The same schedule repeats every day. */
  time: string;
  capacity: number;
  /** Seats already taken by other (seeded, offline) visitors for every day. */
  taken: number;
}

export interface Museum {
  id: string;
  name: string;
  district: string;
  exhibition: string;
  description: string;
  tags: string[];
  price: number;
  tone: Tone;
  slots: TimeSlot[];
}

export type BookingStatus = "active" | "cancelled";

export interface Booking {
  id: string;
  museumId: string;
  /** Local visit date, YYYY-MM-DD. */
  date: string;
  time: string;
  visitorName: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
  status: BookingStatus;
}

// Demo seed data: fictional museums so prices and schedules never contradict real venues.
export const MUSEUMS: Museum[] = [
  {
    id: "meridian-art",
    name: "Meridian Museum of Art",
    district: "Riverside District",
    exhibition: "Light & Line: Modern Masters",
    description: "Paintings and drawings tracing a century of modernism.",
    tags: ["Fine Art", "Modern"],
    price: 18,
    tone: "oxblood",
    slots: [
      { time: "10:00", capacity: 30, taken: 12 },
      { time: "12:00", capacity: 30, taken: 26 },
      { time: "14:00", capacity: 30, taken: 8 },
      { time: "16:00", capacity: 30, taken: 30 },
    ],
  },
  {
    id: "halden-natural-history",
    name: "Halden Natural History Museum",
    district: "Old Town",
    exhibition: "Giants of the Ice Age",
    description: "Fossils, skeletons and a walk-through glacier cave.",
    tags: ["Natural History", "Science", "Family"],
    price: 14,
    tone: "sage",
    slots: [
      { time: "09:30", capacity: 40, taken: 15 },
      { time: "11:30", capacity: 40, taken: 34 },
      { time: "13:30", capacity: 40, taken: 20 },
      { time: "15:30", capacity: 40, taken: 5 },
    ],
  },
  {
    id: "lumen-photography",
    name: "Lumen Gallery of Photography",
    district: "Canal Quarter",
    exhibition: "Street Light: City Portraits",
    description: "Documentary and street photography from five continents.",
    tags: ["Photography", "Contemporary"],
    price: 12,
    tone: "ink",
    slots: [
      { time: "11:00", capacity: 20, taken: 6 },
      { time: "14:00", capacity: 20, taken: 17 },
      { time: "17:00", capacity: 20, taken: 2 },
    ],
  },
  {
    id: "old-harbor-maritime",
    name: "Old Harbor Maritime Museum",
    district: "Harbourfront",
    exhibition: "Charting the Northern Seas",
    description: "Ship models, navigation tools and a restored lighthouse lens.",
    tags: ["History", "Maritime", "Family"],
    price: 10,
    tone: "slate",
    slots: [
      { time: "10:00", capacity: 25, taken: 4 },
      { time: "13:00", capacity: 25, taken: 25 },
      { time: "15:00", capacity: 25, taken: 11 },
    ],
  },
  {
    id: "kinetic-science",
    name: "Kinetic Science Center",
    district: "Innovation Park",
    exhibition: "Motion Lab: Forces in Play",
    description: "Hands-on experiments with gravity, magnets and robotics.",
    tags: ["Science", "Technology", "Family"],
    price: 16,
    tone: "ochre",
    slots: [
      { time: "09:00", capacity: 35, taken: 9 },
      { time: "11:00", capacity: 35, taken: 29 },
      { time: "13:00", capacity: 35, taken: 18 },
      { time: "15:00", capacity: 35, taken: 33 },
    ],
  },
];
