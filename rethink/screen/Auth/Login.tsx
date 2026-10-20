import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Rise } from '../../ui/motion';
import { Screen, Txt, Field, PopButton, Sticker } from '../../ui/kit';
import { palette, font, TAB_BAR_SPACE } from '../../ui/theme';
import { loginAPI } from '../../services/API/authAPI';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
    const navigation = useNavigation<any>();
    const { setIsAuthenticated, checkAuth } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Almost there', 'Fill in every field to continue.');
            return;
        }

        setLoading(true);
        try {
            await loginAPI(email, password);
            await checkAuth(); // Refetch profile to update state
            // Navigation will happen automatically due to RootNavigator/AuthProvider
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || 'An unexpected error occurred';
            Alert.alert('Login Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Screen>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={authStyles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Rise style={authStyles.header}>
                        <Sticker text="hey again" tone="sun" tilt={-5} style={{ marginBottom: 14 }} />
                        <Text style={authStyles.title}>Welcome{'\n'}back.</Text>
                        <Txt style={authStyles.subtitle}>Log in to sync your limits, focus schedules and coach notes.</Txt>
                    </Rise>

                    <Rise delay={120} style={authStyles.form}>
                        <Field
                            icon="mail-outline"
                            placeholder="Email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />
                        <Field
                            icon="lock-closed-outline"
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoComplete="password"
                            right={
                                <Pressable
                                    onPress={() => setShowPassword(!showPassword)}
                                    hitSlop={10}
                                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    <Ionicons
                                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={20}
                                        color={palette.inkSoft}
                                    />
                                </Pressable>
                            }
                        />

                        <PopButton title="Log in" tone="cobalt" onPress={handleLogin} loading={loading} style={{ marginTop: 8 }} />

                        <View style={authStyles.footer}>
                            <Txt>New here? </Txt>
                            <Pressable onPress={() => navigation.navigate('Signup')} hitSlop={8}>
                                <Text style={authStyles.link}>Make an account</Text>
                            </Pressable>
                        </View>
                    </Rise>
                </ScrollView>
            </KeyboardAvoidingView>
        </Screen>
    );
}

export const authStyles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: TAB_BAR_SPACE,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 28,
    },
    title: {
        fontFamily: font.display,
        fontSize: 48,
        lineHeight: 52,
        letterSpacing: -1.5,
        color: palette.ink,
    },
    subtitle: {
        marginTop: 10,
        fontSize: 16,
    },
    form: {
        gap: 14,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },
    link: {
        fontFamily: font.bodyBold,
        fontSize: 15,
        color: palette.ink,
        textDecorationLine: 'underline',
    },
});
