import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { color } from '../../constant/color';
import { guardNative } from '../../services/guard/guardNative';
import { useGuardStatus } from '../../utils/useGuardStatus';
import PermissionManager from '../../utils/PermissionManager';
import AccessibilityDisclosure from './AccessibilityDisclosure';

/**
 * Shown whenever blocking can't work because the accessibility service is off, so limits,
 * focus mode and the mindful pause never fail silently.
 */
const GuardStatusBanner: React.FC = () => {
    const { isServiceEnabled } = useGuardStatus();
    const [showDisclosure, setShowDisclosure] = useState(false);

    if (!guardNative.isAvailable || isServiceEnabled !== false) return null;

    const handleFix = async () => {
        if (await PermissionManager.hasAcceptedDisclosure()) {
            await PermissionManager.requestAccessibilityPermission();
        } else {
            setShowDisclosure(true);
        }
    };

    const handleAccept = async () => {
        setShowDisclosure(false);
        await PermissionManager.acceptDisclosure();
        await PermissionManager.requestAccessibilityPermission();
    };

    return (
        <>
            <TouchableOpacity style={styles.banner} onPress={handleFix} activeOpacity={0.85}>
                <Ionicons name="warning-outline" size={22} color={WARNING} />
                <View style={styles.text}>
                    <Text style={styles.title}>Protection is off</Text>
                    <Text style={styles.subtitle}>
                        Limits, Focus Mode and Mindful Pause can't block apps until you turn on Rethink in
                        Accessibility settings.
                    </Text>
                </View>
                <Text style={styles.action}>Fix</Text>
            </TouchableOpacity>
            <AccessibilityDisclosure
                visible={showDisclosure}
                onAccept={handleAccept}
                onDecline={() => setShowDisclosure(false)}
            />
        </>
    );
};

const WARNING = '#FFB020';

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 176, 32, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255, 176, 32, 0.35)',
    },
    text: {
        flex: 1,
    },
    title: {
        color: color.white,
        fontSize: 15,
        fontWeight: '700',
    },
    subtitle: {
        color: '#C8CDCA',
        fontSize: 12,
        lineHeight: 17,
        marginTop: 2,
    },
    action: {
        color: WARNING,
        fontSize: 15,
        fontWeight: '700',
    },
});

export default GuardStatusBanner;
