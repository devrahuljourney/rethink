import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { color } from '../../../constant/color';

interface InterventionToggleProps {
    isEnabled: boolean;
    onToggle: (value: boolean) => void;
}

const InterventionToggle: React.FC<InterventionToggleProps> = ({ isEnabled, onToggle }) => {
    return (
        <View style={styles.container}>
            <View style={styles.leftContent}>
                <View style={[styles.iconContainer, { backgroundColor: isEnabled ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 255, 255, 0.05)' }]}>
                    <Ionicons
                        name={isEnabled ? "shield-checkmark-outline" : "shield-outline"}
                        size={22}
                        color={isEnabled ? "#34C759" : color.secondary}
                    />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.label}>Smart Intervention</Text>
                    <Text style={styles.subLabel}>Pause app after limit exceeded</Text>
                </View>
            </View>
            <Switch
                trackColor={{ false: '#333', true: 'rgba(52, 199, 89, 0.4)' }}
                thumbColor={isEnabled ? '#34C759' : '#999'}
                ios_backgroundColor="#333"
                onValueChange={onToggle}
                value={isEnabled}
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
