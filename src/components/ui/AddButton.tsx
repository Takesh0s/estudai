import { Pressable, StyleSheet } from 'react-native';
import { radius, useTheme } from '../../theme';
import { AppText } from './AppText';

type AddButtonProps = {
  label: string;
  onPress: () => void;
};

/** Wide outlined "+ Adicionar ..." action pinned above the tab bar in the design. */
export function AddButton({ label, onPress }: AddButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          borderColor: `${colors.brand.primary}80`,
          backgroundColor: pressed ? colors.background.greenSoft : 'transparent',
        },
      ]}
    >
      <AppText variant="bodyStrong" tone="link">
        + {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 64,
    borderRadius: radius.card,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
