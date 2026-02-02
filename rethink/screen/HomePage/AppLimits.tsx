import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { color } from '../../constant/color';
import { useAppLimits } from '../../context/AppLimitContext';
import { formatTime } from '../../utils/timeUtils';

const AppLimits = () => {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { packageName } = route.params || {};
    const { addLimit, updateLimit, deleteLimit, limits } = useAppLimits();

    const existingLimit = limits.find(l => l.packageName === packageName);

    const [hours, setHours] = useState(
        existingLimit ? Math.floor(existingLimit.dailyLimitMs / (1000 * 60 * 60)).toString() : '1'
    );
    const [minutes, setMinutes] = useState(
        existingLimit ? Math.floor((existingLimit.dailyLimitMs % (1000 * 60 * 60)) / (1000 * 60)).toString() : '0'
    );

    const handleSave = async () => {
        const h = parseInt(hours) || 0;
        const m = parseInt(minutes) || 0;
        const totalMs = (h * 60 * 60 * 1000) + (m * 60 * 1000);

        if (totalMs === 0) {
            Alert.alert('Invalid Limit', 'Please set a limit greater than 0.');
            return;
        }

        try {
            if (existingLimit) {
                await updateLimit(existingLimit.id, { dailyLimitMs: totalMs });
            } else {
                await addLimit({
                    packageName,
                    dailyLimitMs: totalMs,
                    warningThresholdMs: 5 * 60 * 1000, // 5 min default
                    enabled: true,
                });
            }
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Failed to save limit.');
        }
    };

    const handleDelete = async () => {
        if (!existingLimit) return;

        Alert.alert(
            'Remove Limit',
            'Are you sure you want to remove the time limit for this app?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteLimit(existingLimit.id);
                        navigation.goBack();
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={color.white} />
                </TouchableOpacity>
                <Text style={styles.title}>{existingLimit ? 'Edit Limit' : 'Set Limit'}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.appCard}>
                    <Text style={styles.appLabel}>App</Text>
                    <Text style={styles.appValue}>{packageName?.split('.').pop() || 'Selected App'}</Text>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Daily Duration</Text>
                    <View style={styles.timeInputs}>
                        <View style={styles.timeField}>
                            <TextInput
                                style={styles.input}
                                value={hours}
                                onChangeText={setHours}
                                keyboardType="number-pad"
                                maxLength={2}
                            />
                            <Text style={styles.timeLabel}>hours</Text>
                        </View>
                        <View style={styles.timeField}>
                            <TextInput
                                style={styles.input}
                                value={minutes}
                                onChangeText={setMinutes}
                                keyboardType="number-pad"
                                maxLength={2}
                            />
                            <Text style={styles.timeLabel}>mins</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save Limit</Text>
                </TouchableOpacity>

                {existingLimit && (
                    <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                        <Text style={styles.deleteButtonText}>Remove Limit</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: color.black,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1E1E1E',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    title: {
        fontSize: 20,
        color: color.white,
        fontWeight: '700',
    },
    content: {
        padding: 24,
    },
    appCard: {
        backgroundColor: '#1E1E1E',
        padding: 20,
        borderRadius: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    appLabel: {
        color: color.secondary,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    appValue: {
        color: color.white,
        fontSize: 18,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    inputContainer: {
        backgroundColor: '#1E1E1E',
        padding: 20,
        borderRadius: 20,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    inputLabel: {
        color: color.white,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 20,
    },
    timeInputs: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    timeField: {
        flex: 1,
        alignItems: 'center',
    },
    input: {
        backgroundColor: '#2A2A2A',
        width: '80%',
        height: 60,
        borderRadius: 12,
        color: color.white,
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
    },
    timeLabel: {
        color: color.secondary,
        fontSize: 12,
        marginTop: 8,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: color.primary,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    saveButtonText: {
        color: color.black,
        fontSize: 16,
        fontWeight: '700',
    },
    deleteButton: {
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FF3B30',
    },
    deleteButtonText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AppLimits;
