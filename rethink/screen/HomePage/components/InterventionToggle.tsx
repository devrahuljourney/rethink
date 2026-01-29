import React from 'react';
import { View, Text, StyleSheet, Switch, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { color } from '../../../constant/color';
import { useIntervention } from '../../../context/InterventionContext';
import PermissionManager from '../../../utils/PermissionManager';

interface InterventionToggleProps {
    // These might be kept if the parent still wants to track it, 
    // but we'll primary use the context now.
    isEnabled?: boolean;
    onToggle?: (value: boolean) => void;
}

const InterventionToggle: React.FC<InterventionToggleProps> = () => {
    const { isInterventionEnabled, setIsInterventionEnabled } = useIntervention();

    const handleToggle = async (value: boolean) => {
        if (value) {
            // Check permissions before enabling
            const hasAccessibility = await PermissionManager.checkAccessibilityPermission();
            if (!hasAccessibility) {
                Alert.alert(
                    'Accessibility Permission Required',
                    'Rethink needs accessibility permission to detect when you open certain apps.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Settings', onPress: () => PermissionManager.requestAccessibilityPermission() }
                    ]
                );
                return;
            }

            const hasOverlay = await PermissionManager.checkOverlayPermission();
            if (!hasOverlay) {
                Alert.alert(
                    'Overlay Permission Required',
                    'Rethink needs permission to display the intervention screen over other apps.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Settings', onPress: () => PermissionManager.requestOverlayPermission() }
                    ]
                );
                return;
            }
        }

        setIsInterventionEnabled(value);
    };

    return (
        <View style={styles.container}>
            <View style={styles.leftContent}>
                <View style={[styles.iconContainer, { backgroundColor: isInterventionEnabled ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 255, 255, 0.05)' }]}>
                    <Ionicons
                        name={isInterventionEnabled ? "shield-checkmark-outline" : "shield-outline"}
                        size={22}
                        color={isInterventionEnabled ? "#34C759" : color.secondary}
                    />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.label}>Smart Intervention</Text>
                    <Text style={styles.subLabel}>Pause app after limit exceeded</Text>
                </View>
            </View>
            <Switch
                trackColor={{ false: '#333', true: 'rgba(52, 199, 89, 0.4)' }}
                thumbColor={isInterventionEnabled ? '#34C759' : '#999'}
                ios_backgroundColor="#333"
                onValueChange={handleToggle}
                value={isInterventionEnabled}
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
