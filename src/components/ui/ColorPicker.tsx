import { Pressable, StyleSheet, View } from 'react-native';
import { spacing, subjectColors, useTheme } from '../../theme';
import { Icon } from '../icons/Icon';
import { AppText } from './AppText';

type ColorPickerProps = {
  label?: string;
  value: string;
  onChange: (color: string) => void;
};

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrapper}>
      {label ? <AppText variant="label">{label}</AppText> : null}
      <View style={styles.row}>
        {subjectColors.map((color) => {
          const selected = color.toLowerCase() === value.toLowerCase();
          return (
            <Pressable
              key={color}
              accessibilityRole="radio"
              accessibilityLabel={`Cor ${color}`}
              accessibilityState={{ selected }}
              onPress={() => onChange(color)}
              style={[
                styles.swatch,
                { backgroundColor: color, borderColor: selected ? colors.text.primary : 'transparent' },
              ]}
            >
              {selected ? <Icon name="confirmar" size={22} color="#FFFFFF" strokeWidth={3} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
