import { useCallback, useRef } from "react";
import { getDeviceId } from "@/lib/device";
import { mergeCalendar } from "@/lib/calendarSync";
import { loadCalendar, saveCalendar } from "@/lib/vaultData";
import type { CalendarData, CalendarEvent, SyncStatus } from "@/types";

export function useCalendarSync(
  vaultPath: string | null,
  events: CalendarEvent[],
  setEvents: (events: CalendarEvent[]) => void,
  setCalendarSyncStatus: (status: SyncStatus) => void,
  showToast: (msg: string) => void,
) {
  const localRef = useRef<CalendarData>({
    events: [],
    version: 1,
    updatedAt: new Date(0).toISOString(),
  });
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isWriting = useRef(false);

  const loadFromVault = useCallback(async () => {
    if (!vaultPath) return;
    const remote = await loadCalendar(vaultPath);
    const merged = mergeCalendar(localRef.current, remote);
    localRef.current = merged;
    setEvents(merged.events);
    setCalendarSyncStatus("synced");
  }, [vaultPath, setEvents, setCalendarSyncStatus]);

  const persist = useCallback(
    (nextEvents: CalendarEvent[], immediate = false) => {
      if (!vaultPath) return;

      const data: CalendarData = {
        events: nextEvents,
        version: localRef.current.version + 1,
        updatedAt: new Date().toISOString(),
      };
      localRef.current = data;
      setEvents(nextEvents);
      setCalendarSyncStatus("pending");

      const write = async () => {
        isWriting.current = true;
        try {
          await saveCalendar(vaultPath, data);
          setCalendarSyncStatus("synced");
        } finally {
          isWriting.current = false;
        }
      };

      if (immediate) {
        if (writeTimer.current) clearTimeout(writeTimer.current);
        void write();
        return;
      }

      if (writeTimer.current) clearTimeout(writeTimer.current);
      writeTimer.current = setTimeout(() => void write(), 300);
    },
    [vaultPath, setEvents, setCalendarSyncStatus],
  );

  const addEvent = useCallback(
    (event: Omit<CalendarEvent, "updatedAt" | "deviceId">) => {
      const full: CalendarEvent = {
        ...event,
        updatedAt: new Date().toISOString(),
        deviceId: getDeviceId(),
      };
      persist([...events, full]);
    },
    [events, persist],
  );

  const deleteEvent = useCallback(
    (id: string) => {
      persist(events.filter((e) => e.id !== id));
    },
    [events, persist],
  );

  const handleExternalChange = useCallback(async () => {
    if (!vaultPath || isWriting.current) return;
    const remote = await loadCalendar(vaultPath);
    const merged = mergeCalendar(localRef.current, remote);
    const changed =
      merged.events.length !== localRef.current.events.length ||
      merged.updatedAt !== localRef.current.updatedAt;

    localRef.current = merged;
    setEvents(merged.events);
    setCalendarSyncStatus("synced");
    if (changed) showToast("Calendar synced");
  }, [vaultPath, setEvents, setCalendarSyncStatus, showToast]);

  return {
    loadFromVault,
    addEvent,
    deleteEvent,
    handleExternalChange,
    setLocalCalendar: (data: CalendarData) => {
      localRef.current = data;
    },
  };
}
