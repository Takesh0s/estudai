import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../../components/icons/Icon';
import { AppText, Avatar, BackButton, Button, Notice, Screen, TextField } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import type { AppScreenProps } from '../../navigation/types';
import { radius, spacing, useTheme } from '../../theme';

const AVATAR_SIZE = 104;

export function EditProfileScreen({ navigation }: AppScreenProps<'EditProfile'>) {
  const { colors } = useTheme();
  const { profile, session, displayName, updateProfile, uploadAvatar } = useAuth();
  const [name, setName] = useState(displayName);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const nameChanged = name.trim() !== displayName;
  const hasChanges = nameChanged || photoUri !== null;

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 ?? null);
    }
  }

  async function handleSave() {
    if (name.trim().length < 2) {
      setNameError('Digite seu nome.');
      return;
    }
    setNameError(undefined);
    setFormError(null);
    setSaving(true);
    try {
      if (photoUri) {
        if (!photoBase64) throw new Error('The picker did not return the image data.');
        await uploadAvatar(photoBase64);
      }
      if (nameChanged) await updateProfile({ full_name: name.trim() });
      Alert.alert('Perfil atualizado', 'Suas alterações foram salvas.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      setFormError('Não foi possível salvar o perfil. Verifique a conexão e tente de novo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen scroll>
      <View style={styles.form}>
        <BackButton onPress={() => navigation.goBack()} />
        <AppText variant="screenTitle" accessibilityRole="header">
          Editar perfil
        </AppText>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Trocar foto de perfil"
          onPress={pickPhoto}
          style={styles.avatarButton}
        >
          <Avatar name={name || displayName} uri={photoUri ?? profile?.avatar_url} size={AVATAR_SIZE} />
          <View
            style={[
              styles.badge,
              { backgroundColor: colors.brand.primary, borderColor: colors.background.app },
            ]}
          >
            <Icon name="editar" size={18} color={colors.text.onPrimary} />
          </View>
        </Pressable>
        <AppText variant="caption" tone="secondary" align="center">
          Toque na foto para escolher outra da galeria.
        </AppText>

        <TextField
          label="Nome"
          placeholder="Digite seu nome"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="done"
          onSubmitEditing={handleSave}
          error={nameError}
        />
        <View style={styles.email}>
          <AppText variant="label">E-mail</AppText>
          <AppText tone="secondary">{session?.user.email ?? ''}</AppText>
          <AppText variant="caption" tone="secondary">
            O e-mail da conta não pode ser alterado por aqui.
          </AppText>
        </View>

        {formError ? <Notice tone="error" message={formError} /> : null}
        <Button label="Salvar alterações" onPress={handleSave} loading={saving} disabled={!hasChanges} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  avatarButton: { alignSelf: 'center', marginTop: spacing.md },
  badge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  email: { gap: spacing.xs },
});
