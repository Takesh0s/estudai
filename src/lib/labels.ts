import type { ContentStatus, EventType } from './database.types';

export const contentStatusLabels: Record<ContentStatus, string> = {
  a_estudar: 'A estudar',
  estudando: 'Estudando',
  revisado: 'Revisado',
};

export const contentStatusOrder: ContentStatus[] = ['a_estudar', 'estudando', 'revisado'];

export const eventTypeLabels: Record<EventType, string> = {
  prova: 'Prova',
  trabalho: 'Trabalho',
  atividade: 'Atividade',
  outro: 'Outro',
};

export const eventTypeOrder: EventType[] = ['prova', 'trabalho', 'atividade', 'outro'];

/** Singular / plural helper: plural(1, 'matéria', 'matérias') -> "1 matéria". */
export function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

/** Reminder lead time as shown in the reminder settings and the profile summary. */
export function daysBeforeLabel(days: number) {
  if (days === 0) return 'No dia';
  return days === 1 ? '1 dia antes' : `${days} dias antes`;
}
