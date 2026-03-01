import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { color } from '../../constant/color';
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
      Alert.alert("Error", "Could not pick an image.");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await updateProfileAPI(name, mobileStatus, avatarUrl || undefined);
      if (res && res.success) {
        Alert.alert("Success", "Profile updated successfully!");
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
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await logoutAPI();
              setIsAuthenticated(false);
              await checkAuth();
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Failed to logout.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarContainer} onPress={handleSelectImage}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={50} color={color.secondary} />
                </View>
              )}
              <View style={styles.cameraIconContainer}>
                <Ionicons name="camera" size={16} color={color.black} />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarLabel}>Tap to change avatar</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={color.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={color.secondary}
                value={name}
                onChangeText={setName}
              />
            </View>

            <Text style={styles.inputLabel}>Mobile Number</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color={color.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mobile Number"
                placeholderTextColor={color.secondary}
                value={mobileStatus}
                onChangeText={setMobileStatus}
                keyboardType="phone-pad"
              />
            </View>

            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={[styles.inputContainer, styles.disabledInputContainer]}>
              <Ionicons name="mail-outline" size={20} color={color.secondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={user?.email || 'user@example.com'}
                editable={false}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={color.black} />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loading}>
              <Ionicons name="log-out-outline" size={20} color="#FF5252" style={{ marginRight: 8 }} />
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: color.black || '#000',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    color: color.white || '#FFF',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatarContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: color.primary || '#177AD5',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: color.black,
  },
  avatarLabel: {
    marginTop: 12,
    color: color.secondary,
    fontSize: 14,
  },
  formContainer: {
    marginTop: 10,
  },
  inputLabel: {
    color: color.white,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginBottom: 20,
  },
  disabledInputContainer: {
    backgroundColor: '#121212',
    borderColor: '#1A1A1A',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: color.white,
    fontSize: 16,
  },
  disabledInput: {
    color: color.secondary,
  },
  saveButton: {
    backgroundColor: color.primary || '#177AD5',
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
    shadowColor: color.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: color.black,
    fontSize: 18,
    fontWeight: '800',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.3)',
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  logoutButtonText: {
    color: '#FF5252',
    fontSize: 18,
    fontWeight: '700',
  },
});