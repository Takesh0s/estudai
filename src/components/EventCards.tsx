import { StyleSheet, View } from 'react-native';
import type { StudyEvent } from '../lib/database.types';
import { formatTime, WEEKDAYS_SHORT } from '../lib/dates';
import { eventColor, eventStart } from '../lib/events';
import { eventTypeLabels } from '../lib/labels';
import { radius, spacing, useTheme } from '../theme';
import { Icon } from './icons/Icon';
import { AppText, Card } from './ui';

type EventCardProps = {
  event: StudyEvent;
  subjectName?: string;
  onPress: () => void;
};

/** Agenda row: time on the left, accent bar, title and reminder status. */
export function AgendaEventCard({
  event,
  subjectName,
  hasReminder,
  onPress,
}: EventCardProps & { hasReminder: boolean }) {
  const { colors } = useTheme();
  const start = eventStart(event);
  return (
    <Card
      flush
      onPress={onPress}
      accessibilityLabel={`${eventTypeLabels[event.type]}, ${event.title}, ${formatTime(start)}`}
      style={styles.row}
    >
      <AppText variant="highlight" tone="secondary" style={styles.time}>
        {formatTime(start)}
      </AppText>
      <View style={[styles.bar, { backgroundColor: eventColor(event) }]} />
      <View style={styles.body}>
        <AppText variant="bodyStrong">{event.title}</AppText>
        {subjectName ? (
          <AppText variant="caption" tone="secondary">
            {subjectName}
          </AppText>
        ) : null}
        {hasReminder ? (
          <View style={styles.reminder}>
            <Icon name="lembrete" size={20} color={colors.text.secondary} />
            <AppText variant="label" tone="secondary">
              Lembrete ativo
            </AppText>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

/** Compact row for lists across several days: day block, accent bar, title, type and time. */
export function DateEventCard({ event, subjectName, onPress }: EventCardProps) {
  const start = eventStart(event);
  const detail = [eventTypeLabels[event.type], formatTime(start), subjectName]
    .filter(Boolean)
    .join(' · ');
  return (
    <Card
      flush
      onPress={onPress}
      accessibilityLabel={`${event.title}, ${detail}`}
      style={styles.row}
    >
      <View style={[styles.bar, styles.barLeading, { backgroundColor: eventColor(event) }]} />
      <View style={styles.dateBlock}>
        <AppText variant="highlight">{String(start.getDate()).padStart(2, '0')}</AppText>
        <AppText variant="small" tone="secondary">
          {WEEKDAYS_SHORT[start.getDay()].toUpperCase()}
        </AppText>
      </View>
      <View style={styles.body}>
        <AppText variant="bodyStrong" numberOfLines={2}>
          {event.title}
        </AppText>
        <AppText variant="caption" tone="secondary" numberOfLines={1}>
          {detail}
        </AppText>
      </View>
    </Card>
  );
}

/** Read-only row for a national holiday. */
export function HolidayCard({ name }: { name: string }) {
  const { colors } = useTheme();
  return (
    <Card flush style={styles.row}>
      <View style={[styles.holidayIcon, { backgroundColor: colors.background.greenSoft }]}>
        <Icon name="calendario" size={22} color={colors.text.highlight} />
      </View>
      <View style={styles.body}>
        <AppText variant="bodyStrong">{name}</AppText>
        <AppText variant="caption" tone="secondary">
          Feriado nacional
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingRight: spacing.lg },
  time: { width: 64, textAlign: 'right' },
  bar: { alignSelf: 'stretch', width: 4, borderRadius: 2 },
  barLeading: { marginLeft: spacing.lg },
  body: { flex: 1, gap: 2 },
  reminder: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  dateBlock: { width: 40, alignItems: 'center' },
  holidayIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.lg,
  },
});
