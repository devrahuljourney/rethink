import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { Screen, Txt, Card, Field, PopButton, Sticker, SectionLabel } from '../../ui/kit';
import { palette, font, radius, stroke, TAB_BAR_SPACE } from '../../ui/theme';
import { Rise } from '../../ui/motion';
import { useAuth } from '../../context/AuthContext';
import { updateProfileAPI, logoutAPI } from '../../services/API/authAPI';

export default function Setting() {
  const { user, checkAuth, setIsAuthenticated } = useAuth();

  const [name, setName] = useState('');
  const [mobileStatus, setMobileStatus] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setMobileStatus(user.mobile_number || '');
      setAvatarUrl(user.avatar_url || null);
    }
  }, [user]);

  const handleSelectImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: true,
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.8,
      });

      if (result.didCancel || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      if (asset.base64) {
        const base64Image = `data:${asset.type};base64,${asset.base64}`;
        setAvatarUrl(base64Image);
      }
    } catch (error) {
      console.error('ImagePicker Error: ', error);
      Alert.alert("Couldn't open photos", "Try again, or check that Rethink can access your photos.");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await updateProfileAPI(name, mobileStatus, avatarUrl || undefined);
      if (res && res.success) {
        Alert.alert("Saved", "Your profile is up to date.");
        await checkAuth();
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to update profile';
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Log out?",
      "Your limits and focus schedules stay on this phone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log out",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await logoutAPI();
            } catch (error) {
              // An expired session can't be logged out server-side; the local token is already cleared
              console.log('Logout request failed, signing out locally:', error);
            } finally {
              setLoading(false);
              setIsAuthenticated(false);
            }
          }
        }
      ]
    );
  };

  const initial = (name || user?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Rise>
            <Txt v="display">You</Txt>
          </Rise>

          <Rise delay={80} style={styles.profileWrap}>
            <Card tone="lilac" style={styles.profileCard}>
              <Pressable
                style={styles.avatarContainer}
                onPress={handleSelectImage}
                accessibilityRole="button"
                accessibilityLabel="Change photo"
              >
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.initial}>{initial}</Text>
                  </View>
                )}
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={15} color={palette.ink} />
                </View>
              </Pressable>
              <View style={styles.profileText}>
                <Txt v="h1" numberOfLines={1}>{name || 'No name yet'}</Txt>
                <Text style={styles.email} numberOfLines={1}>{user?.email || 'not logged in'}</Text>
              </View>
            </Card>
            <Sticker text="tap photo to change" tone="sun" tilt={4} delay={500} style={styles.profileSticker} />
          </Rise>

          <SectionLabel>Name</SectionLabel>
          <Field
            icon="person-outline"
            placeholder="Your name"
            value={name}
            onChangeText={setName}
            autoComplete="name"
          />

          <SectionLabel style={styles.gap}>Phone</SectionLabel>
          <Field
            icon="call-outline"
            placeholder="Phone number"
            value={mobileStatus}
            onChangeText={setMobileStatus}
            keyboardType="phone-pad"
          />

          <SectionLabel style={styles.gap} right={<Txt v="label">can't change</Txt>}>Email</SectionLabel>
          <Field icon="mail-outline" value={user?.email || ''} editable={false} />

          <PopButton title="Save changes" tone="cobalt" onPress={handleSave} loading={loading} style={{ marginTop: 28 }} />

          <Pressable
            style={({ pressed }) => [styles.logoutButton, pressed && { backgroundColor: palette.peach }]}
            onPress={handleLogout}
            disabled={loading}
            accessibilityRole="button"
          >
            <Ionicons name="log-out-outline" size={20} color={palette.ink} />
            <Text style={styles.logoutButtonText}>Log out</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const AVATAR = 76;

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: TAB_BAR_SPACE,
  },
  profileWrap: {
    marginTop: 18,
    marginBottom: 26,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileSticker: {
    position: 'absolute',
    right: 12,
    bottom: -12,
  },
  avatarContainer: {
    width: AVATAR,
    height: AVATAR,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: stroke,
    borderColor: palette.ink,
  },
  avatarPlaceholder: {
    backgroundColor: palette.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: font.display,
    fontSize: 34,
    color: palette.ink,
  },
  cameraBadge: {
    position: 'absolute',
    right: -4,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: stroke,
    borderColor: palette.ink,
    backgroundColor: palette.sun,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    flex: 1,
    marginLeft: 16,
  },
  email: {
    fontFamily: font.mono,
    fontSize: 12,
    color: palette.ink,
    marginTop: 2,
  },
  gap: {
    marginTop: 18,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    marginTop: 14,
    borderRadius: radius.md,
    borderWidth: stroke,
    borderColor: palette.ink,
    borderStyle: 'dashed',
  },
  logoutButtonText: {
    fontFamily: font.bodyBold,
    color: palette.ink,
    fontSize: 16,
  },
});
