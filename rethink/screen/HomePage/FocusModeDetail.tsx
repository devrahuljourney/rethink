import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    ScrollView,
    FlatList,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { color } from '../../constant/color';
import { useFocusMode } from '../../context/FocusModeContext';
import { useUsage } from '../../context/UsageContext';
import { FocusMode, FocusSchedule } from '../../types/appLimits';

const DAYS = [
    { label: 'M', value: 1 },
    { label: 'T', value: 2 },
    { label: 'W', value: 3 },
    { label: 'T', value: 4 },
    { label: 'F', value: 5 },
    { label: 'S', value: 6 },
    { label: 'S', value: 0 },
];

const FocusModeDetail = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { focusModeId } = route.params || {};
    const { focusModes, addFocusMode, updateFocusMode, deleteFocusMode } = useFocusMode();
    const { usageData } = useUsage();

    const existingMode = focusModes.find(m => m.id === focusModeId);

    const [name, setName] = useState(existingMode?.name || 'My Focus');
    const [startTime, setStartTime] = useState(existingMode?.schedules?.[0]?.startTime || '09:00');
    const [endTime, setEndTime] = useState(existingMode?.schedules?.[0]?.endTime || '17:00');
    const [selectedDays, setSelectedDays] = useState<number[]>(existingMode?.schedules?.[0]?.days || [1, 2, 3, 4, 5]);
    const [blockedApps, setBlockedApps] = useState<string[]>(existingMode?.blockedApps || []);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredApps = useMemo(() => {
        return usageData.filter(app => {
            const appName = (app.appName || app.packageName.split('.').pop() || '').toLowerCase();
            return appName.includes(searchQuery.toLowerCase()) ||
                app.packageName.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [usageData, searchQuery]);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a name.');
            return;
        }

        const schedule: FocusSchedule = {
            enabled: true,
            startTime,
            endTime,
            days: selectedDays,
        };

        try {
            if (existingMode) {
                await updateFocusMode(existingMode.id, {
                    name,
                    schedules: [schedule],
                    blockedApps,
                });
            } else {
                await addFocusMode({
                    name,
                    enabled: true,
                    schedules: [schedule],
                    blockedApps,
                    whitelistedApps: [],
                });
            }
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Failed to save focus mode.');
        }
    };

    const handleDelete = async () => {
        if (!existingMode) return;

        Alert.alert(
            'Delete Focus Mode',
            'Are you sure you want to remove this focus mode?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteFocusMode(existingMode.id);
                        navigation.goBack();
                    }
                }
            ]
        );
    };

    const toggleAppBlock = (packageName: string) => {
        if (blockedApps.includes(packageName)) {
            setBlockedApps(blockedApps.filter(p => p !== packageName));
        } else {
            setBlockedApps([...blockedApps, packageName]);
        }
    };

    const toggleDay = (day: number) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day));
        } else {
            setSelectedDays([...selectedDays, day].sort());
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={color.white} />
                </TouchableOpacity>
                <Text style={styles.title}>{existingMode ? 'Edit Focus' : 'New Focus'}</Text>
                <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                    <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>NAME</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Focus Name"
                        placeholderTextColor="#666"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>SCHEDULE</Text>
                    <View style={styles.timeRow}>
                        <View style={styles.timeField}>
                            <Text style={styles.timeLabel}>Start</Text>
                            <TextInput
                                style={styles.timeInput}
                                value={startTime}
                                onChangeText={setStartTime}
                                placeholder="09:00"
                                placeholderTextColor="#666"
                            />
                        </View>
                        <View style={styles.timeField}>
                            <Text style={styles.timeLabel}>End</Text>
                            <TextInput
                                style={styles.timeInput}
                                value={endTime}
                                onChangeText={setEndTime}
                                placeholder="17:00"
                                placeholderTextColor="#666"
                            />
                        </View>
                    </View>

                    <View style={styles.daysRow}>
                        {DAYS.map(day => (
                            <TouchableOpacity
                                key={day.value}
                                style={[
                                    styles.dayChip,
                                    selectedDays.includes(day.value) && styles.dayChipActive
                                ]}
                                onPress={() => toggleDay(day.value)}
                            >
                                <Text style={[
                                    styles.dayText,
                                    selectedDays.includes(day.value) && styles.dayTextActive
                                ]}>
                                    {day.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={[styles.section, { flex: 1 }]}>
                    <Text style={styles.sectionLabel}>BLOCKED APPS ({blockedApps.length})</Text>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={18} color="#666" />
                        <TextInput
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search apps to block..."
                            placeholderTextColor="#666"
                        />
                    </View>

                    <View style={styles.appList}>
                        {filteredApps.slice(0, 10).map(app => (
                            <TouchableOpacity
                                key={app.packageName}
                                style={styles.appItem}
                                onPress={() => toggleAppBlock(app.packageName)}
                            >
                                <View style={styles.appInfo}>
                                    <Text style={styles.appName} numberOfLines={1}>
                                        {app.appName || app.packageName.split('.').pop()}
                                    </Text>
                                    <Text style={styles.packageName} numberOfLines={1}>
                                        {app.packageName}
                                    </Text>
                                </View>
                                <Switch
                                    value={blockedApps.includes(app.packageName)}
                                    onValueChange={() => toggleAppBlock(app.packageName)}
                                    trackColor={{ false: '#333', true: color.primary }}
                                    thumbColor={color.white}
                                />
                            </TouchableOpacity>
                        ))}
                        {filteredApps.length > 10 && (
                            <Text style={styles.moreApps}>+ {filteredApps.length - 10} more apps found</Text>
                        )}
                    </View>
                </View>

                {existingMode && (
                    <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                        <Text style={styles.deleteText}>Delete Focus Mode</Text>
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
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1E1E1E',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        color: color.white,
        fontWeight: '700',
    },
    saveButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    saveButtonText: {
        color: color.primary,
        fontSize: 16,
        fontWeight: '700',
    },
    content: {
        padding: 24,
    },
    section: {
        marginBottom: 32,
    },
    sectionLabel: {
        color: color.secondary,
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 12,
        letterSpacing: 1,
    },
    input: {
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        padding: 16,
        color: color.white,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    timeRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    timeField: {
        flex: 1,
    },
    timeLabel: {
        color: color.secondary,
        fontSize: 12,
        marginBottom: 8,
    },
    timeInput: {
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        padding: 16,
        color: color.white,
        fontSize: 16,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    daysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dayChip: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1E1E1E',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    dayChipActive: {
        backgroundColor: color.primary,
        borderColor: color.primary,
    },
    dayText: {
        color: color.secondary,
        fontSize: 14,
        fontWeight: '700',
    },
    dayTextActive: {
        color: color.black,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 50,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        color: color.white,
        fontSize: 14,
    },
    appList: {
        backgroundColor: '#1E1E1E',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#333',
    },
    appItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    appInfo: {
        flex: 1,
        marginRight: 10,
    },
    appName: {
        color: color.white,
        fontSize: 14,
        fontWeight: '600',
    },
    packageName: {
        color: '#666',
        fontSize: 11,
        marginTop: 2,
    },
    moreApps: {
        textAlign: 'center',
        padding: 12,
        color: '#666',
        fontSize: 12,
        fontStyle: 'italic',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        padding: 16,
        gap: 8,
    },
    deleteText: {
        color: '#FF3B30',
        fontSize: 14,
        fontWeight: '600',
    }
});

export default FocusModeDetail;
