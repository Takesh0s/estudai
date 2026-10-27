import { Switch } from 'react-native';

import { useTheme } from '../../theme';

type ToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
};

export function Toggle({ value, onValueChange, accessibilityLabel, disabled }: ToggleProps) {
  const { colors } = useTheme();

  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      trackColor={{ false: colors.background.toggleOff, true: colors.brand.primary }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={colors.background.toggleOff}
    />
  );
}
