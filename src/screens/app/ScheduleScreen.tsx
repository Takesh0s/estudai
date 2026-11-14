import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { DataGate } from '../../components/DataGate';
import { AgendaEventCard, HolidayCard } from '../../components/EventCards';
import { CalendarMonthIcon } from '../../components/icons/CalendarMonthIcon';
import { Icon } from '../../components/icons/Icon';
import { AddButton, AppText, EmptyState, Screen } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import {
  addDays,
  formatLongDate,
  formatMonthYear,
  fromDateKey,
  isSameDay,
  startOfDay,
  toDateKey,
  WEEKDAYS_SHORT,
  weekDays,
} from '../../lib/dates';
import { eventColor, groupEventsByDay } from '../../lib/events';
import { useHolidays } from '../../lib/holidays';
import { hasActiveReminder } from '../../lib/notifications';
import type { TabScreenProps } from '../../navigation/types';
import { fonts, radius, spacing, useTheme } from '../../theme';

const MAX_DOTS = 2;

export function ScheduleScreen({ navigation, route }: TabScreenProps<'Schedule'>) {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const { events, subjects } = useData();

  const [selected, setSelected] = useState(() => startOfDay(new Date()));
  const paramDate = route.params?.date;

  // The calendar sends the chosen day as a param. It is consumed and cleared so
  // choosing the same day again later still works.
  useFocusEffect(
    useCallback(() => {
      if (!paramDate) return;
      setSelected(fromDateKey(paramDate));
      navigation.setParams({ date: undefined });
    }, [paramDate, navigation]),
  );

  const days = useMemo(() => weekDays(selected), [selected]);
  const byDay = useMemo(() => groupEventsByDay(events), [events]);
  const holidays = useHolidays([days[0].getFullYear(), days[6].getFullYear()]);

  const today = new Date();
  const selectedKey = toDateKey(selected);
  const dayEvents = byDay.get(selectedKey) ?? [];
  const holiday = holidays.get(selectedKey);
  const subjectName = (id: string | null) => subjects.find((subject) => subject.id === id)?.name;

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <AppText variant="screenTitle" accessibilityRole="header" style={styles.flex}>
          {formatMonthYear(selected)}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Abrir calendário de ${formatMonthYear(selected)}`}
          onPress={() => navigation.navigate('Calendar', { date: selectedKey })}
          style={[
            styles.calendarButton,
            { backgroundColor: colors.background.surface, borderColor: colors.border.default },
          ]}
        >
          <CalendarMonthIcon month={selected.getMonth() + 1} size={28} color={colors.text.link} />
        </Pressable>
      </View>

      <View style={styles.strip}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Semana anterior"
          hitSlop={8}
          onPress={() => setSelected(addDays(selected, -7))}
          style={styles.arrow}
        >
          <View style={styles.flip}>
            <Icon name="proximaSemana" size={26} color={colors.text.link} />
          </View>
        </Pressable>
        {days.map((day) => {
          const key = toDateKey(day);
          const isSelected = isSameDay(day, selected);
          const isToday = isSameDay(day, today);
          const dots = [...new Set((byDay.get(key) ?? []).map((event) => eventColor(event, today)))].slice(
            0,
            MAX_DOTS,
          );
          const isHoliday = holidays.has(key);
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${formatLongDate(day)}${isHoliday ? `, ${holidays.get(key)?.name}` : ''}`}
              onPress={() => setSelected(day)}
              style={[styles.day, isSelected && { backgroundColor: colors.brand.primary }]}
            >
              <AppText variant="caption" tone={isSelected ? 'onPrimary' : 'secondary'}>
                {WEEKDAYS_SHORT[day.getDay()]}
              </AppText>
              <AppText
                variant="bodyStrong"
                tone={isSelected ? 'onPrimary' : isHoliday || isToday ? 'link' : 'primary'}
                style={isToday && !isSelected ? styles.today : undefined}
              >
                {day.getDate()}
              </AppText>
              <View style={styles.dots}>
                {dots.map((color) => (
                  <View
                    key={color}
                    style={[styles.dot, { backgroundColor: isSelected ? colors.text.onPrimary : color }]}
                  />
                ))}
              </View>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Próxima semana"
          hitSlop={8}
          onPress={() => setSelected(addDays(selected, 7))}
          style={styles.arrow}
        >
          <Icon name="proximaSemana" size={26} color={colors.text.link} />
        </Pressable>
      </View>

      <AppText variant="label" style={styles.heading}>
        {formatLongDate(selected).replace('-feira', '')}
      </AppText>

      <DataGate>
        {dayEvents.length === 0 && !holiday ? (
          <EmptyState
            icon="calendario"
            title="Nenhum evento neste dia"
            description="Adicione provas, trabalhos e datas importantes para receber lembretes no momento certo."
          />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
            {holiday ? <HolidayCard name={holiday.name} /> : null}
            {dayEvents.map((event) => (
              <AgendaEventCard
                key={event.id}
                event={event}
                subjectName={subjectName(event.subject_id)}
                hasReminder={hasActiveReminder(event, profile)}
                onPress={() => navigation.navigate('EventForm', { eventId: event.id })}
              />
            ))}
          </ScrollView>
        )}
        <View style={styles.footer}>
          <AddButton
            label="Adicionar novo evento"
            onPress={() => navigation.navigate('EventForm', { date: selectedKey })}
          />
        </View>
      </DataGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calendarButton: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strip: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: spacing.lg },
  arrow: { width: 28, height: 56, alignItems: 'center', justifyContent: 'center' },
  flip: { transform: [{ rotate: '180deg' }] },
  day: {
    flex: 1,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: radius.pill,
  },
  today: { fontFamily: fonts.bold, textDecorationLine: 'underline' },
  dots: { flexDirection: 'row', gap: 3, height: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  heading: { marginTop: spacing.xl, marginBottom: spacing.md },
  list: { gap: spacing.md, paddingBottom: spacing.lg },
  footer: { paddingTop: spacing.md, paddingBottom: spacing.lg },
});
