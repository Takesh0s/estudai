import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { formatShortDate, formatTime } from '../../lib/dates';
import { radius, sizes, spacing, useTheme } from '../../theme';
import { Icon } from '../icons/Icon';
import { AppText } from './AppText';

type DateTimeFieldProps = {
  label: string;
  value: Date;
  mode: 'date' | 'time';
  onChange: (value: Date) => void;
};

/**
 * Looks like a TextField and opens the native picker: a dialog on Android,
 * an inline picker below the field on iOS.
 */
export function DateTimeField({ label, value, mode, onChange }: DateTimeFieldProps) {
  const { colors } = useTheme();
  const [iosOpen, setIosOpen] = useState(false);
  const text = mode === 'date' ? formatShortDate(value) : formatTime(value);

  function open() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode,
        is24Hour: true,
        onValueChange: (_event, selected) => onChange(selected),
      });
    } else {
      setIosOpen((current) => !current);
    }
  }

  return (
    <View style={styles.wrapper}>
      <AppText variant="label">{label}</AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${text}`}
        onPress={open}
        style={[
          styles.box,
          {
            backgroundColor: colors.background.surface,
            borderColor: iosOpen ? colors.brand.primary : colors.border.field,
            borderWidth: iosOpen ? 1.5 : 1,
          },
        ]}
      >
        <AppText style={styles.text}>{text}</AppText>
        <Icon name={mode === 'date' ? 'calendario' : 'relogio'} color={colors.text.link} />
      </Pressable>
      {iosOpen && Platform.OS === 'ios' ? (
        <DateTimePicker
          value={value}
          mode={mode}
          display={mode === 'date' ? 'inline' : 'spinner'}
          locale="pt-BR"
          accentColor={colors.brand.primary}
          onValueChange={(_event, selected) => onChange(selected)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  box: {
    minHeight: sizes.fieldHeight,
    borderRadius: radius.field,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  text: { flex: 1 },
});
