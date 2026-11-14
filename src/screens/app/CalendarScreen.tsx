import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { DateEventCard } from '../../components/EventCards';
import { DataGate } from '../../components/DataGate';
import { Icon } from '../../components/icons/Icon';
import { AppText, Screen } from '../../components/ui';
import { useData } from '../../contexts/DataContext';
import {
  addMonths,
  formatMonthYear,
  fromDateKey,
  isSameDay,
  monthGrid,
  MONTHS_SHORT,
  startOfDay,
  toDateKey,
  WEEKDAY_INITIALS,
} from '../../lib/dates';
import { eventColor, eventStart, groupEventsByDay, upcomingEvents } from '../../lib/events';
import { useHolidays } from '../../lib/holidays';
import { plural } from '../../lib/labels';
import type { AppScreenProps } from '../../navigation/types';
import { fonts, radius, spacing, useTheme } from '../../theme';

type Mode = 'mes' | 'ano';

const CELL = 44;
const MAX_DOTS = 3;
const UPCOMING_LIMIT = 5;

export function CalendarScreen({ navigation, route }: AppScreenProps<'Calendar'>) {
  const { colors } = useTheme();
  const { events, subjects } = useData();

  const selected = route.params?.date ? fromDateKey(route.params.date) : startOfDay(new Date());
  const [mode, setMode] = useState<Mode>('mes');
  const [cursor, setCursor] = useState(() => addMonths(selected, 0));

  const today = new Date();
  const holidays = useHolidays([cursor.getFullYear()]);
  const byDay = useMemo(() => groupEventsByDay(events), [events]);
  const upcoming = useMemo(() => upcomingEvents(events).slice(0, UPCOMING_LIMIT), [events]);
  const subjectName = (id: string | null) => subjects.find((subject) => subject.id === id)?.name;

  const year = cursor.getFullYear();
  const monthCounts = useMemo(() => {
    const counts = Array.from({ length: 12 }, () => 0);
    for (const event of events) {
      const start = eventStart(event);
      if (start.getFullYear() === year) counts[start.getMonth()] += 1;
    }
    return counts;
  }, [events, year]);

  function pickDay(day: Date) {
    // Returns to the agenda with that day selected.
    navigation.popTo('Tabs', { screen: 'Schedule', params: { date: toDateKey(day) } });
  }

  const cells = monthGrid(cursor.getFullYear(), cursor.getMonth());
  const weeks = Array.from({ length: cells.length / 7 }, (_, row) => cells.slice(row * 7, row * 7 + 7));

  return (
    <Screen edges={['top']}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        onPress={() => navigation.goBack()}
        style={styles.titleRow}
      >
        <Icon name="voltar" size={28} />
        <AppText variant="screenTitle" accessibilityRole="header">
          Calendário
        </AppText>
      </Pressable>

      <View
        style={[
          styles.segmented,
          { backgroundColor: colors.background.surface, borderColor: colors.border.default },
        ]}
      >
        {(['mes', 'ano'] as const).map((option) => {
          const active = mode === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setMode(option)}
              style={[styles.segment, active && { backgroundColor: colors.brand.primary }]}
            >
              <AppText
                tone={active ? 'onPrimary' : 'secondary'}
                style={{ fontFamily: active ? fonts.bold : fonts.medium }}
              >
                {option === 'mes' ? 'Mês' : 'Ano'}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.nav}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={mode === 'mes' ? 'Mês anterior' : 'Ano anterior'}
          hitSlop={8}
          onPress={() => setCursor(addMonths(cursor, mode === 'mes' ? -1 : -12))}
          style={styles.navButton}
        >
          <Icon name="voltar" size={24} />
        </Pressable>
        <AppText variant="highlight" accessibilityRole="header">
          {mode === 'mes' ? formatMonthYear(cursor) : String(year)}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={mode === 'mes' ? 'Próximo mês' : 'Próximo ano'}
          hitSlop={8}
          onPress={() => setCursor(addMonths(cursor, mode === 'mes' ? 1 : 12))}
          style={styles.navButton}
        >
          <Icon name="avancar" size={24} />
        </Pressable>
      </View>

      <DataGate>
        {mode === 'mes' ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <View style={styles.weekdays}>
              {WEEKDAY_INITIALS.map((initial, index) => (
                <AppText key={index} variant="caption" tone="secondary" align="center" style={styles.weekday}>
                  {initial}
                </AppText>
              ))}
            </View>
            {weeks.map((week, row) => (
              <View key={row} style={styles.weekRow}>
                {week.map((day, column) => {
                  if (!day) return <View key={column} style={styles.cell} />;
                  const key = toDateKey(day);
                  const isSelected = isSameDay(day, selected);
                  const isToday = isSameDay(day, today);
                  const dots = [
                    ...new Set((byDay.get(key) ?? []).map((event) => eventColor(event, today))),
                  ].slice(0, MAX_DOTS);
                  const isHoliday = holidays.has(key);
                  return (
                    <Pressable
                      key={column}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`${day.getDate()} de ${formatMonthYear(day)}${isHoliday ? `, ${holidays.get(key)?.name}` : ''}`}
                      onPress={() => pickDay(day)}
                      style={styles.cell}
                    >
                      <View
                        style={[
                          styles.dayCircle,
                          isSelected && { backgroundColor: colors.brand.primary },
                          !isSelected && isToday && { borderWidth: 1.5, borderColor: colors.brand.primary },
                        ]}
                      >
                        <AppText
                          variant={isSelected || isToday || isHoliday ? 'bodyStrong' : 'body'}
                          tone={isSelected ? 'onPrimary' : isHoliday ? 'link' : 'primary'}
                        >
                          {day.getDate()}
                        </AppText>
                      </View>
                      <View style={styles.dots}>
                        {dots.map((color, index) => (
                          <View key={`${color}-${index}`} style={[styles.dot, { backgroundColor: color }]} />
                        ))}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}

            <AppText variant="highlight" style={styles.upcomingTitle}>
              Próximas tarefas pendentes
            </AppText>
            <View style={styles.upcoming}>
              {upcoming.length === 0 ? (
                <AppText tone="secondary">Nada pendente por enquanto.</AppText>
              ) : (
                upcoming.map((event) => (
                  <DateEventCard
                    key={event.id}
                    event={event}
                    subjectName={subjectName(event.subject_id)}
                    onPress={() => navigation.navigate('EventForm', { eventId: event.id })}
                  />
                ))
              )}
            </View>
          </ScrollView>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <View style={styles.months}>
              {MONTHS_SHORT.map((label, month) => {
                const current = year === today.getFullYear() && month === today.getMonth();
                const count = monthCounts[month];
                return (
                  <Pressable
                    key={label}
                    accessibilityRole="button"
                    accessibilityLabel={`${label} ${year}, ${count === 0 ? 'sem eventos' : plural(count, 'evento', 'eventos')}`}
                    onPress={() => {
                      setCursor(new Date(year, month, 1));
                      setMode('mes');
                    }}
                    style={[
                      styles.month,
                      {
                        backgroundColor: current ? colors.brand.primary : colors.background.surface,
                        borderColor: current ? colors.brand.primary : colors.border.default,
                      },
                    ]}
                  >
                    <AppText variant="highlight" tone={current ? 'onPrimary' : count === 0 ? 'secondary' : 'primary'}>
                      {label}
                    </AppText>
                    <AppText variant="small" tone={current ? 'onPrimary' : 'secondary'}>
                      {count === 0 ? 'Sem eventos' : plural(count, 'evento', 'eventos')}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
            <AppText variant="caption" tone="secondary" style={styles.hint}>
              Toque em um mês para ver os dias e eventos.
            </AppText>
          </ScrollView>
        )}
      </DataGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, alignSelf: 'flex-start', minHeight: 44 },
  segmented: {
    flexDirection: 'row',
    borderRadius: radius.field,
    borderWidth: 1,
    padding: 4,
    marginTop: spacing.md,
  },
  segment: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.field - 4 },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  navButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: spacing.xxl },
  weekdays: { flexDirection: 'row', marginBottom: spacing.xs },
  weekday: { flex: 1 },
  weekRow: { flexDirection: 'row' },
  cell: { flex: 1, height: CELL + 14, alignItems: 'center', justifyContent: 'flex-start' },
  dayCircle: { width: CELL - 6, height: CELL - 6, borderRadius: (CELL - 6) / 2, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 3, height: 6, marginTop: 1 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  upcomingTitle: { marginTop: spacing.xl },
  upcoming: { gap: spacing.md, marginTop: spacing.md },
  months: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  month: {
    width: '31%',
    flexGrow: 1,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.md,
    gap: 2,
    minHeight: 76,
    justifyContent: 'center',
  },
  hint: { marginTop: spacing.lg },
});
