import type { Slot } from "@prisma/client";
import { LANGUAGE_BADGE } from "./language";

const TOUR_DURATION_MINUTES = 60;

/** Escape text per RFC 5545 (backslash, semicolon, comma, newline). */
function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Fold lines longer than 75 octets with CRLF + space, per RFC 5545. */
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    out.push(rest.slice(0, 75));
    rest = " " + rest.slice(75);
  }
  out.push(rest);
  return out.join("\r\n");
}

/**
 * Floating local time (no Z / TZID): calendar apps interpret it in the
 * device's local timezone, which is right for an in-person local event.
 */
function localStamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}00`
  );
}

function utcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Builds a single-event .ics file with a display reminder 1 hour before. */
export function buildIcs(slot: Slot): string {
  const badge = LANGUAGE_BADGE[slot.language];
  const summary = badge ? `${slot.title} (${badge})` : slot.title;
  const end = new Date(slot.startsAt.getTime() + TOUR_DURATION_MINUTES * 60 * 1000);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//R3 Tour Team//Tour Signups//EN",
    "BEGIN:VEVENT",
    `UID:${slot.id}@r3-tour-signups`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART:${localStamp(slot.startsAt)}`,
    `DTEND:${localStamp(end)}`,
    `SUMMARY:${escapeText(summary)}`,
    ...(slot.notes ? [`DESCRIPTION:${escapeText(slot.notes)}`] : []),
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(`Tour soon: ${slot.title}`)}`,
    "TRIGGER:-PT1H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.map(fold).join("\r\n") + "\r\n";
}
