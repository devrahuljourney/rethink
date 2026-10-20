import React, { useState } from 'react';
import {
    View,
    Text,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Rise } from '../../ui/motion';
import { Screen, Txt, Field, PopButton, Sticker, RoundButton } from '../../ui/kit';
import { palette } from '../../ui/theme';
import { authStyles } from './Login';
import { signUpAPI } from '../../services/API/authAPI';

export default function SignupScreen() {
    const navigation = useNavigation<any>();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSignup = async () => {
        if (!name || !email || !mobileNumber || !password || !confirmPassword) {
            Alert.alert('Almost there', 'Fill in every field to continue.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Passwords differ', 'The two passwords don\'t match. Try again.');
            return;
        }

        setLoading(true);
        try {
            await signUpAPI(
                email,
                password,
                name,
                mobileNumber,
                confirmPassword,
            );

            Alert.alert('You\'re in', 'Account created. Log in to start.', [
                { text: 'OK', onPress: () => navigation.navigate('Login') }
            ]);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || 'An unexpected error occurred';
            Alert.alert('Signup Failed', errorMessage);
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
                    contentContainerStyle={[authStyles.scrollContent, { justifyContent: 'flex-start', paddingTop: 12 }]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <RoundButton icon="arrow-back" label="Go back" onPress={() => navigation.goBack()} style={{ marginBottom: 24 }} />

                    <Rise style={authStyles.header}>
                        <Sticker text="takes 30 sec" tone="mint" tilt={4} style={{ marginBottom: 14 }} />
                        <Text style={authStyles.title}>Make an{'\n'}account.</Text>
                        <Txt style={authStyles.subtitle}>So your limits and focus schedules follow you to a new phone.</Txt>
                    </Rise>

                    <Rise delay={120} style={authStyles.form}>
                        <Field
                            icon="person-outline"
                            placeholder="Your name"
                            value={name}
                            onChangeText={setName}
                            autoComplete="name"
                        />
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
                            icon="call-outline"
                            placeholder="Phone number"
                            value={mobileNumber}
                            onChangeText={setMobileNumber}
                            keyboardType="phone-pad"
                            autoComplete="tel"
                        />
                        <Field
                            icon="lock-closed-outline"
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
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
                        <Field
                            icon="lock-closed-outline"
                            placeholder="Password, once more"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showPassword}
                        />

                        <PopButton title="Create account" tone="tomato" onPress={handleSignup} loading={loading} style={{ marginTop: 8 }} />

                        <View style={authStyles.footer}>
                            <Txt>Already have one? </Txt>
                            <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8}>
                                <Text style={authStyles.link}>Log in</Text>
                            </Pressable>
                        </View>
                    </Rise>
                </ScrollView>
            </KeyboardAvoidingView>
        </Screen>
    );
}
