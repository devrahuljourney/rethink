import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { color } from '../../../constant/color';
import { useIntervention } from '../../../context/InterventionContext';
import PermissionManager from '../../../utils/PermissionManager';
import AccessibilityDisclosure from '../../Intervention/AccessibilityDisclosure';

interface InterventionToggleProps {
    /** When set, toggles the mindful pause for this one app instead of the whole feature. */
    packageName?: string;
}

const InterventionToggle: React.FC<InterventionToggleProps> = ({ packageName }) => {
    const { isInterventionEnabled, setIsInterventionEnabled, isMonitored, setAppMonitored } = useIntervention();
    const [showDisclosure, setShowDisclosure] = useState(false);

    const isOn = packageName ? isInterventionEnabled && isMonitored(packageName) : isInterventionEnabled;

    const turnOn = () => {
        if (packageName) setAppMonitored(packageName, true);
        setIsInterventionEnabled(true);
    };

    const handleToggle = async (value: boolean) => {
        if (!value) {
            if (packageName) setAppMonitored(packageName, false);
            else setIsInterventionEnabled(false);
            return;
        }

        if (await PermissionManager.checkAccessibilityPermission()) {
            turnOn();
            return;
        }

        // Play policy: explain and get consent before sending the user to accessibility settings.
        if (await PermissionManager.hasAcceptedDisclosure()) {
            turnOn();
            await PermissionManager.requestAccessibilityPermission();
        } else {
            setShowDisclosure(true);
        }
    };

    const handleAcceptDisclosure = async () => {
        setShowDisclosure(false);
        await PermissionManager.acceptDisclosure();
        turnOn();
        await PermissionManager.requestAccessibilityPermission();
    };

    return (
        <View style={styles.container}>
            <View style={styles.leftContent}>
                <View style={[styles.iconContainer, { backgroundColor: isOn ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 255, 255, 0.05)' }]}>
                    <Ionicons
                        name={isOn ? "shield-checkmark-outline" : "shield-outline"}
                        size={22}
                        color={isOn ? "#34C759" : color.secondary}
                    />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.label}>Mindful Pause</Text>
                    <Text style={styles.subLabel}>
                        {packageName ? 'Take a breath before opening this app' : 'Take a breath before opening distracting apps'}
                    </Text>
                </View>
            </View>
            <Switch
                trackColor={{ false: '#333', true: 'rgba(52, 199, 89, 0.4)' }}
                thumbColor={isOn ? '#34C759' : '#999'}
                ios_backgroundColor="#333"
                onValueChange={handleToggle}
                value={isOn}
            />
            <AccessibilityDisclosure
                visible={showDisclosure}
                onAccept={handleAcceptDisclosure}
                onDecline={() => setShowDisclosure(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1E1E1E',
        borderRadius: 24,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    label: {
        color: color.white,
        fontSize: 16,
        fontWeight: '700',
    },
    subLabel: {
        color: color.secondary,
        fontSize: 12,
        marginTop: 2,
    },
});

export default InterventionToggle;
