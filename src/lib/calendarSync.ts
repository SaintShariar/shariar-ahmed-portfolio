import type { CalendarData, CalendarEvent } from "@/types";

export function emptyCalendar(): CalendarData {
  return { events: [], version: 1, updatedAt: new Date(0).toISOString() };
}

/** Merge by event id; newer updatedAt wins for same id. */
export function mergeCalendar(
  local: CalendarData,
  remote: CalendarData,
): CalendarData {
  const byId = new Map<string, CalendarEvent>();

  for (const event of remote.events) {
    byId.set(event.id, event);
  }

  for (const event of local.events) {
    const existing = byId.get(event.id);
    if (!existing) {
      byId.set(event.id, event);
      continue;
    }
    const localTime = Date.parse(event.updatedAt || "0");
    const remoteTime = Date.parse(existing.updatedAt || "0");
    byId.set(event.id, localTime >= remoteTime ? event : existing);
  }

  const mergedEvents = [...byId.values()].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  const localUpdated = Date.parse(local.updatedAt || "0");
  const remoteUpdated = Date.parse(remote.updatedAt || "0");

  return {
    events: mergedEvents,
    version: Math.max(local.version, remote.version) + 1,
    updatedAt: new Date(Math.max(localUpdated, remoteUpdated)).toISOString(),
  };
}

export function dailyNotePath(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}.md`;
}
