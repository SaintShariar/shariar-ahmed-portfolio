import { memo, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Cloud, CloudOff, Plus } from "lucide-react";
import { dailyNotePath } from "@/lib/calendarSync";
import type { CalendarEvent, SyncStatus } from "@/types";

interface CalendarViewProps {
  events: CalendarEvent[];
  syncStatus: SyncStatus;
  onAddEvent: (event: Omit<CalendarEvent, "updatedAt" | "deviceId">) => void;
  onOpenNote?: (notePath: string) => void;
  onOpenDailyNote?: (date: Date) => void;
}

const SYNC_LABEL: Record<SyncStatus, string> = {
  synced: "Synced",
  pending: "Saving…",
  conflict: "Conflict",
};

function CalendarViewInner({
  events,
  syncStatus,
  onAddEvent,
  onOpenNote,
  onOpenDailyNote,
}: CalendarViewProps) {
  const [current, setCurrent] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(current));
    const end = endOfWeek(endOfMonth(current));
    return eachDayOfInterval({ start, end });
  }, [current]);

  const selectedEvents = useMemo(
    () =>
      events.filter(
        (e) => selected && isSameDay(parseISO(e.date), selected),
      ),
    [events, selected],
  );

  function handleAddEvent() {
    if (!selected) return;
    const title = prompt("Event title:");
    if (!title) return;
    const notePath = dailyNotePath(selected);
    onAddEvent({
      id: crypto.randomUUID(),
      title,
      date: format(selected, "yyyy-MM-dd"),
      notePath,
      color: "#58a6ff",
    });
  }

  function handleDayClick(day: Date) {
    setSelected(day);
    onOpenDailyNote?.(day);
  }

  return (
    <div className="calendar-view">
      <header className="calendar-view__header">
        <button
          type="button"
          className="icon-btn"
          onClick={() => setCurrent(addMonths(current, -1))}
        >
          <ChevronLeft size={18} />
        </button>
        <h2>{format(current, "MMMM yyyy")}</h2>
        <span
          className={`calendar-sync-badge calendar-sync-badge--${syncStatus}`}
        >
          {syncStatus === "synced" ? (
            <Cloud size={14} />
          ) : (
            <CloudOff size={14} />
          )}
          {SYNC_LABEL[syncStatus]}
        </span>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setCurrent(addMonths(current, 1))}
        >
          <ChevronRight size={18} />
        </button>
      </header>

      <div className="calendar-view__weekdays">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="calendar-view__grid">
        {days.map((day) => {
          const dayEvents = events.filter((e) =>
            isSameDay(parseISO(e.date), day),
          );
          const isSelected = selected && isSameDay(day, selected);
          return (
            <button
              key={day.toISOString()}
              type="button"
              className={[
                "calendar-cell",
                !isSameMonth(day, current) && "calendar-cell--muted",
                isToday(day) && "calendar-cell--today",
                isSelected && "calendar-cell--selected",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => handleDayClick(day)}
            >
              <span className="calendar-cell__num">{format(day, "d")}</span>
              <div className="calendar-cell__dots">
                {dayEvents.slice(0, 3).map((e) => (
                  <span
                    key={e.id}
                    className="calendar-cell__dot"
                    style={{ background: e.color }}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <aside className="calendar-view__sidebar">
        <div className="calendar-view__sidebar-header">
          <h3>{selected ? format(selected, "EEEE, MMM d") : "Select a day"}</h3>
          <button type="button" className="icon-btn" onClick={handleAddEvent}>
            <Plus size={16} />
          </button>
        </div>
        {selected && (
          <p className="calendar-view__daily-note">
            Daily note:{" "}
            <button
              type="button"
              className="link-btn"
              onClick={() => onOpenDailyNote?.(selected)}
            >
              {dailyNotePath(selected)}
            </button>
          </p>
        )}
        <ul className="calendar-view__events">
          {selectedEvents.length === 0 && (
            <li className="calendar-view__empty">No events</li>
          )}
          {selectedEvents.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                className="calendar-event"
                onClick={() => e.notePath && onOpenNote?.(e.notePath)}
              >
                <span
                  className="calendar-event__dot"
                  style={{ background: e.color }}
                />
                {e.title}
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

export const CalendarView = memo(CalendarViewInner);
