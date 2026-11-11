import { StyleSheet, View } from 'react-native';
import { radius, useTheme } from '../../theme';

type ProgressBarProps = {
  /** 0 to 1. */
  value: number;
  color?: string;
  height?: number;
};

export function ProgressBar({ value, color, height = 8 }: ProgressBarProps) {
  const { colors } = useTheme();
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[styles.track, { height, backgroundColor: colors.border.default }]}
    >
      <View
        style={[
          styles.fill,
          { width: `${clamped * 100}%`, backgroundColor: color ?? colors.brand.primary },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: radius.pill, overflow: 'hidden', alignSelf: 'stretch' },
  fill: { height: '100%', borderRadius: radius.pill },
});
