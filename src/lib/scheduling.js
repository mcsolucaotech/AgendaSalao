import { addMinutes, parseISO } from 'date-fns';

const PERIOD_REGEX = /Per[íi]odo:\s*(\d{1,2}):(\d{2})\s*(?:→|->|até|a|[-–—])\s*(\d{1,2}):(\d{2})/i;

function isValidTime(hour, minute) {
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

function buildDateAtTime(baseDate, hour, minute) {
  const d = new Date(baseDate);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function expandAppointmentToTimestamps(appointment) {
  if (!appointment?.data_hora) return [];

  const baseDate = parseISO(appointment.data_hora);
  if (!Number.isFinite(baseDate.getTime())) return [];

  const rawNotes = String(appointment.observacoes || '');
  const periodMatch = rawNotes.match(PERIOD_REGEX);

  if (!periodMatch) {
    return [baseDate.getTime()];
  }

  const startHour = Number.parseInt(periodMatch[1], 10);
  const startMinute = Number.parseInt(periodMatch[2], 10);
  const endHour = Number.parseInt(periodMatch[3], 10);
  const endMinute = Number.parseInt(periodMatch[4], 10);

  if (!isValidTime(startHour, startMinute) || !isValidTime(endHour, endMinute)) {
    return [baseDate.getTime()];
  }

  const rangeStart = buildDateAtTime(baseDate, startHour, startMinute);
  const rangeEnd = buildDateAtTime(baseDate, endHour, endMinute);

  if (rangeEnd.getTime() < rangeStart.getTime()) {
    return [baseDate.getTime()];
  }

  const occupied = [];
  let cursor = new Date(rangeStart);

  while (cursor.getTime() <= rangeEnd.getTime()) {
    occupied.push(cursor.getTime());
    cursor = addMinutes(cursor, 30);
  }

  return occupied;
}

export function buildOccupiedSlotSet(appointments, { excludeIds = [] } = {}) {
  const excluded = new Set(excludeIds.filter(Boolean));
  const occupied = new Set();

  for (const appointment of appointments || []) {
    if (excluded.has(appointment.id)) continue;

    const expanded = expandAppointmentToTimestamps(appointment);
    for (const ts of expanded) {
      occupied.add(ts);
    }
  }

  return occupied;
}
