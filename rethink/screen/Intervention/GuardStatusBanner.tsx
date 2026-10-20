import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Squish } from '../../ui/motion';
import { palette, font, radius, stroke } from '../../ui/theme';
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
            <Squish onPress={handleFix} accessibilityRole="button" style={styles.banner}>
                <Ionicons name="warning" size={20} color={palette.ink} />
                <Text style={styles.text} numberOfLines={2}>
                    <Text style={styles.title}>Blocking is off. </Text>
                    Turn Rethink on in Accessibility.
                </Text>
                <View style={styles.fix}>
                    <Text style={styles.fixText}>Fix</Text>
                </View>
            </Squish>
            <AccessibilityDisclosure
                visible={showDisclosure}
                onAccept={handleAccept}
                onDecline={() => setShowDisclosure(false)}
            />
        </>
    );
};

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginHorizontal: 20,
        marginBottom: 16,
        paddingLeft: 14,
        paddingRight: 8,
        paddingVertical: 8,
        borderRadius: radius.pill,
        borderWidth: stroke,
        borderColor: palette.ink,
        backgroundColor: palette.peach,
    },
    text: {
        flex: 1,
        fontFamily: font.body,
        fontSize: 13,
        lineHeight: 18,
        color: palette.ink,
    },
    title: {
        fontFamily: font.bodyBold,
    },
    fix: {
        backgroundColor: palette.ink,
        borderRadius: radius.pill,
        paddingHorizontal: 14,
        paddingVertical: 7,
    },
    fixText: {
        fontFamily: font.bodyBold,
        fontSize: 13,
        color: palette.card,
    },
});

export default GuardStatusBanner;
