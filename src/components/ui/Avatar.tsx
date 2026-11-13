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
  const fontSize = Math.round(size * 0.45);

  if (uri) {
    return <Image source={{ uri }} style={shape} accessibilityLabel={`Foto de ${name}`} />;
  }

  return (
    <View style={[styles.fallback, shape]} accessibilityLabel={`Foto de ${name}`}>
      {/* The body variant has a fixed line height; at large sizes it would clip the letter. */}
      <AppText
        style={{ fontFamily: fonts.semibold, fontSize, lineHeight: Math.round(fontSize * 1.25), color: colors.text.onHighlight }}
      >
        {initial}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: avatarFallbackColor, alignItems: 'center', justifyContent: 'center' },
});
