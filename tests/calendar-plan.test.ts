import assert from "node:assert/strict";
import { test } from "node:test";
import { calendarIcs, planCalendar } from "../lib/calendar-plan";

const now = Date.parse("2026-11-05T08:00:00Z");
const minute = 60_000;
const week = 7 * 24 * 60;
const block = (start: number, end: number) => ({ start: now + start * minute, end: now + end * minute });

test("finds the earliest two equal sessions across merged windows and busy blocks", () => {
  assert.deepEqual(planCalendar({
    now, preferredMinutes: 45,
    windows: [block(200, 260), block(0, 90), block(40, 180)],
    busy: [block(75, 110), block(30, 100)],
  }), { slots: [block(110, 155), block(200, 245)], durationMinutes: 45 });
});

test("shortens both sessions equally and can use a single free window", () => {
  assert.deepEqual(planCalendar({ now, preferredMinutes: 90, windows: [block(30, 107)] }), {
    slots: [block(30, 68), block(68, 106)], durationMinutes: 38,
  });
});

test("clips slots to the next seven days and excludes a busy block spanning multiple windows", () => {
  assert.deepEqual(planCalendar({
    now, preferredMinutes: 30,
    windows: [block(-60, 30), block(45, 60), block(week - 25, week + 60)],
    busy: [block(20, 65)],
  }), { slots: [block(0, 20), block(week - 25, week - 5)], durationMinutes: 20 });
});

test("returns no plan when two sessions of at least fifteen minutes cannot fit", () => {
  assert.equal(planCalendar({
    now, preferredMinutes: 60, windows: [block(0, 29), block(week, week + 60)],
  }), null);
  assert.equal(planCalendar({ now, preferredMinutes: 0, windows: [block(0, 120)] }), null);
});

test("exports two UTC calendar events with escaped text and UTF-8 content lines", () => {
  const description = "Compare, evaluate; note \\ risks\n" + "🧪".repeat(22);
  const events = [
    { ...block(30, 60), title: "First; session", description },
    { ...block(60, 90), title: "Second session" },
  ];
  const file = calendarIcs(events, now);
  assert.ok(file.startsWith("BEGIN:VCALENDAR\r\n"));
  assert.ok(file.endsWith("END:VCALENDAR\r\n"));
  assert.equal([...file.matchAll(/BEGIN:VEVENT/g)].length, 2);
  const uids = [...file.matchAll(/^UID:(.*)$/gm)].map(match => match[1]);
  assert.equal(new Set(uids).size, 2);
  assert.equal(calendarIcs([events[1]], now).match(/^UID:(.*)$/m)?.[1], uids[1]);
  assert.match(file, /DTSTART:20261105T083000Z\r\nDTEND:20261105T090000Z/);
  assert.ok(file.split("\r\n").every(line => Buffer.byteLength(line) <= 75));
  assert.ok(file.replaceAll("\r\n ", "").includes("DESCRIPTION:Compare\\, evaluate\\; note \\\\ risks\\n" + "🧪".repeat(22)));
});
