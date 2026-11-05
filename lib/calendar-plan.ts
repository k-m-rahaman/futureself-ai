export type TimeBlock = { start: number; end: number };

type CalendarInput = {
  now: number;
  windows: readonly TimeBlock[];
  busy?: readonly TimeBlock[];
  preferredMinutes: number;
};

type CalendarPlan = {
  slots: [TimeBlock, TimeBlock];
  durationMinutes: number;
};

type CalendarEvent = TimeBlock & { title: string; description?: string };

const minute = 60_000;
const week = 7 * 24 * 60 * minute;
const minDuration = 15;

function mergeBlocks(blocks: readonly TimeBlock[], now: number, horizon: number) {
  const sorted = blocks
    .filter(({ start, end }) => Number.isFinite(start) && Number.isFinite(end))
    .map(({ start, end }) => ({ start: Math.max(now, start), end: Math.min(horizon, end) }))
    .filter(({ start, end }) => end > start)
    .sort((a, b) => a.start - b.start);

  const merged: TimeBlock[] = [];
  for (const block of sorted) {
    const previous = merged.at(-1);
    if (previous && block.start <= previous.end) {
      previous.end = Math.max(previous.end, block.end);
    } else {
      merged.push(block);
    }
  }
  return merged;
}

function freeBlocks(windows: readonly TimeBlock[], busy: readonly TimeBlock[]) {
  const free: TimeBlock[] = [];
  let index = 0;
  for (const window of windows) {
    let start = window.start;
    while (index < busy.length && busy[index].start < window.end) {
      const block = busy[index];
      if (start < block.start) free.push({ start, end: block.start });
      start = Math.max(start, block.end);
      if (start >= window.end) break;
      index++;
    }
    if (start < window.end) free.push({ start, end: window.end });
  }
  return free;
}

export function planCalendar({ now, windows, busy = [], preferredMinutes }: CalendarInput): CalendarPlan | null {
  if (!Number.isFinite(now) || !Number.isFinite(preferredMinutes) || preferredMinutes < minDuration) return null;
  const free = freeBlocks(mergeBlocks(windows, now, now + week), mergeBlocks(busy, now, now + week));

  // Equal sessions fit either in the longest block together or in the two longest separately.
  const lengths = free.map(({ start, end }) => (end - start) / minute).sort((a, b) => b - a);
  const maxMinutes = Math.max((lengths[0] ?? 0) / 2, lengths[1] ?? 0);
  const durationMinutes = Math.floor(Math.min(maxMinutes, preferredMinutes));
  if (durationMinutes < minDuration) return null;

  const duration = durationMinutes * minute;
  let first: TimeBlock | undefined;
  for (const block of free) {
    for (let start = block.start; start + duration <= block.end; start += duration) {
      const slot = { start, end: start + duration };
      if (first) return { slots: [first, slot], durationMinutes };
      first = slot;
    }
  }
  return null;
}

function escapeText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\r\n|[\r\n]/g, "\\n").replace(/[,;]/g, "\\$&");
}

function utcStamp(value: number) {
  return new Date(value).toISOString().replace(/[-:]|\.\d{3}/g, "");
}

function eventUid(event: CalendarEvent) {
  let titleHash = 2166136261;
  for (const character of event.title) {
    titleHash = Math.imul(titleHash ^ character.codePointAt(0)!, 16777619);
  }
  return `${event.start}-${event.end}-${(titleHash >>> 0).toString(16)}@futureself.ai`;
}

function foldLine(line: string) {
  const encoder = new TextEncoder();
  let result = "";
  let size = 0;
  for (const character of line) {
    const bytes = encoder.encode(character).length;
    if (size + bytes > 75) {
      result += "\r\n ";
      size = 1;
    }
    result += character;
    size += bytes;
  }
  return result;
}

export function calendarIcs(events: readonly CalendarEvent[], createdAt = Date.now()) {
  const stamp = utcStamp(createdAt);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FutureSelf AI//Decision Experiment//EN",
    ...events.flatMap(event => [
      "BEGIN:VEVENT",
      `UID:${eventUid(event)}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${utcStamp(event.start)}`,
      `DTEND:${utcStamp(event.end)}`,
      `SUMMARY:${escapeText(event.title)}`,
      ...(event.description ? [`DESCRIPTION:${escapeText(event.description)}`] : []),
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
