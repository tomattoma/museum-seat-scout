import { Link } from "@tanstack/react-router";
import { Ticket } from "lucide-react";
import { useBookings } from "@/lib/museum/store";

export function SiteHeader() {
  const { bookings } = useBookings();
  const active = bookings.filter((b) => b.status === "active").length;
  const linkBase =
    "rounded-full px-4 py-2 text-sm font-medium transition-colors";
  const activeLink = { className: "bg-foreground text-background" };
  const inactiveLink = { className: "text-muted-foreground hover:text-foreground" };

  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary font-display text-lg text-primary-foreground">
            M
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">MuseumPass</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            to="/"
            className={linkBase}
            activeProps={activeLink}
            inactiveProps={inactiveLink}
            activeOptions={{ exact: true }}
          >
            Museums
          </Link>
          <Link to="/bookings" className={linkBase} activeProps={activeLink}
            inactiveProps={inactiveLink}>
            <span className="flex items-center gap-1.5">
              <Ticket className="size-4" />
              My Bookings
              {active > 0 && (
                <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                  {active}
                </span>
              )}
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
