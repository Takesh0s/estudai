import type { Profile, StudyEvent, Subject } from '../lib/database.types';

export function makeEvent(overrides: Partial<StudyEvent> = {}): StudyEvent {
  return {
    id: 'event-1',
    user_id: 'user-1',
    subject_id: null,
    type: 'prova',
    title: 'Prova 1',
    starts_at: new Date(2026, 10, 20, 9, 0).toISOString(),
    reminder_enabled: true,
    created_at: '2026-11-01T12:00:00.000Z',
    ...overrides,
  };
}

export function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'user-1',
    full_name: 'Ana',
    avatar_url: null,
    exam_reminder_enabled: true,
    exam_reminder_days_before: 1,
    exam_reminder_time: '20:00:00',
    assignment_reminder_enabled: true,
    assignment_reminder_days_before: 2,
    assignment_reminder_time: '18:30:00',
    high_priority_notifications: false,
    created_at: '2026-11-01T12:00:00.000Z',
    updated_at: '2026-11-01T12:00:00.000Z',
    ...overrides,
  };
}

export function makeSubject(overrides: Partial<Subject> = {}): Subject {
  return {
    id: 'subject-1',
    user_id: 'user-1',
    name: 'Cálculo',
    teacher: null,
    color: '#55B572',
    created_at: '2026-11-01T12:00:00.000Z',
    ...overrides,
  };
}
