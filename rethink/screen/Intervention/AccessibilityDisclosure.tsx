import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { IconTile, PopButton, Sticker, Txt } from '../../ui/kit';
import { palette, font, radius, stroke } from '../../ui/theme';

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
                    <View style={styles.topRow}>
                        <IconTile icon="accessibility" tone="lilac" size={52} />
                        <Sticker text="read this first" tone="sun" tilt={6} />
                    </View>
                    <Txt v="h1" style={styles.title}>Rethink uses the Accessibility Service API</Txt>

                    <Txt style={styles.body}>
                        To show a mindful pause before the apps you choose, and to enforce your app limits
                        and Focus Mode, Rethink needs to know which app is opened on your phone.
                    </Txt>

                    <Bullet icon="eye-outline" text="What we access: only the name of the app that comes to the foreground." />
                    <Bullet icon="eye-off-outline" text="What we never access: anything on your screen, what you type, or your messages." />
                    <Bullet icon="phone-portrait-outline" text="Where it stays: app names are processed on your device and never shared or sold." />
                    <Bullet icon="toggle-outline" text="You're in control: turn it off any time in Settings › Accessibility › Rethink." />
                </ScrollView>

                <PopButton title="Agree and continue" tone="cobalt" onPress={onAccept} style={{ marginTop: 8 }} />
                <Pressable style={styles.secondary} onPress={onDecline} accessibilityRole="button">
                    <Text style={styles.secondaryText}>No thanks</Text>
                </Pressable>
            </View>
        </View>
    </Modal>
);

const Bullet: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
    <View style={styles.bullet}>
        <View style={styles.bulletIcon}>
            <Ionicons name={icon} size={16} color={palette.ink} />
        </View>
        <Text style={styles.bulletText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(27, 26, 31, 0.55)',
        justifyContent: 'center',
        padding: 18,
    },
    card: {
        backgroundColor: palette.paper,
        borderRadius: radius.lg,
        borderWidth: stroke,
        borderColor: palette.ink,
        padding: 20,
        maxHeight: '90%',
    },
    content: {
        paddingBottom: 12,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    title: {
        marginBottom: 10,
    },
    body: {
        marginBottom: 16,
    },
    bullet: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    bulletIcon: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: stroke,
        borderColor: palette.ink,
        backgroundColor: palette.card,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    bulletText: {
        flex: 1,
        fontFamily: font.body,
        color: palette.ink,
        fontSize: 14,
        lineHeight: 20,
        marginTop: 4,
    },
    secondary: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    secondaryText: {
        fontFamily: font.bodyBold,
        color: palette.inkSoft,
        fontSize: 15,
    },
});

export default AccessibilityDisclosure;
