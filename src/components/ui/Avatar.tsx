import { Image, StyleSheet, View } from 'react-native';

import { avatarFallbackColor, fonts, useTheme } from '../../theme';
import { AppText } from './AppText';

type AvatarProps = {
  name: string;
  uri?: string | null;
  size?: number;
};

/** Falls back to the first letter of the name when the user has no photo. */
export function Avatar({ name, uri, size = 50 }: AvatarProps) {
  const { colors } = useTheme();
  const initial = name.trim().charAt(0).toUpperCase() || 'U';
  const shape = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} style={shape} accessibilityLabel={`Foto de ${name}`} />;
  }

  return (
    <View style={[styles.fallback, shape]} accessibilityLabel={`Foto de ${name}`}>
      <AppText style={{ fontFamily: fonts.semibold, fontSize: size * 0.45, color: colors.text.onHighlight }}>{initial}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: avatarFallbackColor, alignItems: 'center', justifyContent: 'center' },
});
