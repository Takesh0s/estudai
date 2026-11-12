import Slider from '@react-native-community/slider';
import { StyleSheet, View } from 'react-native';

import { spacing, useTheme } from '../../theme';
import { AppText } from './AppText';

type StepSliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  /** Turns a value into the text shown beside the label and read by screen readers. */
  formatValue: (value: number) => string;
};

/** Whole-number slider with the current value beside the label and the limits below the track. */
export function StepSlider({ label, value, min, max, onChange, formatValue }: StepSliderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="label">{label}</AppText>
        <AppText variant="bodyStrong" tone="link">
          {formatValue(value)}
        </AppText>
      </View>
      <Slider
        value={value}
        minimumValue={min}
        maximumValue={max}
        step={1}
        onValueChange={(next) => onChange(Math.round(next))}
        minimumTrackTintColor={colors.brand.primary}
        maximumTrackTintColor={colors.background.neutral}
        thumbTintColor={colors.brand.primary}
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: value, text: formatValue(value) }}
        style={styles.slider}
      />
      <View style={styles.limits}>
        <AppText variant="small" tone="secondary">
          {formatValue(min)}
        </AppText>
        <AppText variant="small" tone="secondary">
          {formatValue(max)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  slider: { height: 40, marginHorizontal: -spacing.sm },
  limits: { flexDirection: 'row', justifyContent: 'space-between' },
});
