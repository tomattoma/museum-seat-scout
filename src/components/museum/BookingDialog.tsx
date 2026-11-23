import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MUSEUMS } from "@/lib/museum/catalog";
import {
  MAX_TICKETS,
  MIN_TICKETS,
  formatDateLabel,
  formatPrice,
  isSlotPast,
  remainingSeats,
  type BookingErrors,
} from "@/lib/museum/booking";
import { useBookings } from "@/lib/museum/store";

export interface BookingPreset {
  museumId: string;
  date: string;
  time: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preset: BookingPreset;
  dates: string[];
  now: Date | null;
}

export function BookingDialog({ open, onOpenChange, preset, dates, now }: Props) {
  const { bookings, book } = useBookings();
  const [museumId, setMuseumId] = useState(preset.museumId);
  const [date, setDate] = useState(preset.date);
  const [time, setTime] = useState(preset.time);
  const [visitorName, setVisitorName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState<BookingErrors>({});

  useEffect(() => {
    if (!open) return;
    setMuseumId(preset.museumId);
    setDate(preset.date);
    setTime(preset.time);
    setQuantity(1);
    setErrors({});
  }, [open, preset]);

  const museum = MUSEUMS.find((m) => m.id === museumId);
  const remaining = useMemo(
    () => (museum && date && time ? remainingSeats(museum, date, time, bookings) : null),
    [museum, date, time, bookings],
  );
  const maxSelectable = Math.max(MIN_TICKETS, Math.min(MAX_TICKETS, remaining ?? MAX_TICKETS));
  const total = museum && Number.isFinite(quantity) ? museum.price * quantity : 0;

  const changeMuseum = (id: string) => {
    setMuseumId(id);
    const next = MUSEUMS.find((m) => m.id === id);
    if (next && !next.slots.some((s) => s.time === time)) setTime("");
    setErrors({});
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const result = book({ museumId, date, time, visitorName, quantity });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    toast.success("Booking confirmed", {
      description: `${result.booking.quantity} × ${museum?.name} · ${formatDateLabel(result.booking.date)} at ${result.booking.time}`,
    });
    setVisitorName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-medium">Book a visit</DialogTitle>
          <DialogDescription>
            Demo booking — no payment or account needed. Saved in this browser.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate className="space-y-5">
          <Field label="Museum" htmlFor="museum" error={errors.museumId}>
            <Select value={museumId} onValueChange={changeMuseum}>
              <SelectTrigger id="museum" aria-invalid={!!errors.museumId}>
                <SelectValue placeholder="Choose a museum" />
              </SelectTrigger>
              <SelectContent>
                {MUSEUMS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Date" htmlFor="date" error={errors.date}>
            <Select
              value={date}
              onValueChange={(v) => {
                setDate(v);
                setErrors({});
              }}
            >
              <SelectTrigger id="date" aria-invalid={!!errors.date}>
                <SelectValue placeholder="Choose a date" />
              </SelectTrigger>
              <SelectContent>
                {dates.map((d, i) => (
                  <SelectItem key={d} value={d}>
                    {i === 0 ? `Today · ${formatDateLabel(d)}` : formatDateLabel(d)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Time slot" error={errors.time}>
            <div role="radiogroup" aria-label="Time slot" className="flex flex-wrap gap-2">
              {museum?.slots.map((slot) => {
                const left = date ? remainingSeats(museum, date, slot.time, bookings) : 0;
                const past = date && now ? isSlotPast(date, slot.time, now) : false;
                return (
                  <button
                    key={slot.time}
                    type="button"
                    role="radio"
                    aria-checked={time === slot.time}
                    data-active={time === slot.time}
                    className="chip"
                    disabled={past || left === 0}
                    onClick={() => {
                      setTime(slot.time);
                      setErrors({});
                    }}
                  >
                    <span className="font-semibold">{slot.time}</span>
                    <span className="text-xs opacity-75">
                      {past ? "passed" : left === 0 ? "sold out" : `${left} left`}
                    </span>
                  </button>
                );
              }) ?? <p className="text-sm text-muted-foreground">Choose a museum first.</p>}
            </div>
          </Field>

          <Field label="Visitor name" htmlFor="visitor" error={errors.visitorName}>
            <Input
              id="visitor"
              value={visitorName}
              maxLength={60}
              placeholder="e.g. Alex Demo"
              autoComplete="off"
              aria-invalid={!!errors.visitorName}
              onChange={(e) => {
                setVisitorName(e.target.value);
                setErrors((er) => ({ ...er, visitorName: undefined }));
              }}
            />
          </Field>

          <Field
            label={`Tickets (${MIN_TICKETS}–${MAX_TICKETS})`}
            htmlFor="quantity"
            error={errors.quantity}
            hint={remaining !== null ? `${remaining} seats left for this slot` : undefined}
          >
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Fewer tickets"
                disabled={quantity <= MIN_TICKETS}
                onClick={() => {
                  setQuantity((q) => Math.max(MIN_TICKETS, q - 1));
                  setErrors((er) => ({ ...er, quantity: undefined }));
                }}
              >
                <Minus />
              </Button>
              <Input
                id="quantity"
                type="number"
                inputMode="numeric"
                min={MIN_TICKETS}
                max={maxSelectable}
                className="w-20 text-center"
                value={Number.isFinite(quantity) ? quantity : ""}
                aria-invalid={!!errors.quantity}
                onChange={(e) => {
                  setQuantity(e.target.value === "" ? Number.NaN : Number(e.target.value));
                  setErrors((er) => ({ ...er, quantity: undefined }));
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="More tickets"
                disabled={Number.isFinite(quantity) && quantity >= maxSelectable}
                onClick={() =>
                  setQuantity((q) => Math.min(maxSelectable, (Number.isFinite(q) ? q : 0) + 1))
                }
              >
                <Plus />
              </Button>
            </div>
          </Field>

          {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}

          <DialogFooter className="items-center gap-3 border-t pt-4 sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Total <span className="font-display text-xl text-foreground">{formatPrice(total)}</span>
            </p>
            <Button type="submit" size="lg">
              Confirm booking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string | undefined;
  hint?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
