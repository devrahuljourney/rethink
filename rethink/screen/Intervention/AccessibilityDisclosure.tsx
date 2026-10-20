import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { color } from '../../constant/color';

interface Props {
    visible: boolean;
    onAccept: () => void;
    onDecline: () => void;
}

/**
 * Google Play "prominent disclosure" for the AccessibilityService API.
 * Must be shown in-app, before the user is sent to system settings, and require an
 * explicit affirmative tap. Keep this copy in sync with the Play Console declaration
 * and the privacy policy.
 */
const AccessibilityDisclosure: React.FC<Props> = ({ visible, onAccept, onDecline }) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDecline}>
        <View style={styles.backdrop}>
            <View style={styles.card}>
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="accessibility-outline" size={28} color={color.primary} />
                    </View>
                    <Text style={styles.title}>Rethink uses the Accessibility Service API</Text>

                    <Text style={styles.body}>
                        To show a mindful pause before the apps you choose, and to enforce your app limits
                        and Focus Mode, Rethink needs to know which app is opened on your phone.
                    </Text>

                    <Bullet icon="eye-outline" text="What we access: only the name of the app that comes to the foreground." />
                    <Bullet icon="eye-off-outline" text="What we never access: anything on your screen, what you type, or your messages." />
                    <Bullet icon="phone-portrait-outline" text="Where it stays: app names are processed on your device and never shared or sold." />
                    <Bullet icon="toggle-outline" text="You're in control: turn it off any time in Settings › Accessibility › Rethink." />
                </ScrollView>

                <TouchableOpacity style={styles.primary} onPress={onAccept} accessibilityRole="button">
                    <Text style={styles.primaryText}>Agree and continue</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondary} onPress={onDecline} accessibilityRole="button">
                    <Text style={styles.secondaryText}>No thanks</Text>
                </TouchableOpacity>
            </View>
        </View>
    </Modal>
);

const Bullet: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
    <View style={styles.bullet}>
        <Ionicons name={icon} size={18} color={color.accent} style={styles.bulletIcon} />
        <Text style={styles.bulletText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: '#141414',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        padding: 20,
        maxHeight: '90%',
    },
    content: {
        paddingBottom: 12,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(19, 222, 103, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 16,
    },
    title: {
        color: color.white,
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 12,
    },
    body: {
        color: '#C8CDCA',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    bullet: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    bulletIcon: {
        marginRight: 10,
        marginTop: 1,
    },
    bulletText: {
        flex: 1,
        color: '#C8CDCA',
        fontSize: 14,
        lineHeight: 20,
    },
    primary: {
        backgroundColor: color.primary,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    primaryText: {
        color: color.black,
        fontSize: 16,
        fontWeight: '700',
    },
    secondary: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    secondaryText: {
        color: color.secondary,
        fontSize: 15,
    },
});

export default AccessibilityDisclosure;
