import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Alert,
    ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Screen, TopBar, Txt, Card, Field, PopButton, Toggle, SectionLabel } from '../../ui/kit';
import { palette, font, stroke, TAB_BAR_SPACE } from '../../ui/theme';
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
            Alert.alert('Needs a name', 'Call it something like "Work" or "Bedtime".');
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
            Alert.alert('Not saved', 'Something went wrong saving this schedule. Try again.');
        }
    };

    const handleDelete = async () => {
        if (!existingMode) return;

        Alert.alert(
            'Delete schedule?',
            `"${existingMode.name}" and its muted apps will be removed.`,
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
        <Screen>
            <TopBar
                title={existingMode ? 'Edit schedule' : 'New schedule'}
                onBack={() => navigation.goBack()}
                right={<PopButton small tone="mint" title="Save" onPress={handleSave} />}
            />

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <SectionLabel>Name</SectionLabel>
                <Field value={name} onChangeText={setName} placeholder="Work, Bedtime, Exam week…" />

                <SectionLabel style={styles.gap}>When</SectionLabel>
                <Card>
                    <View style={styles.timeRow}>
                        <View style={styles.timeField}>
                            <Txt v="label">From</Txt>
                            <Field
                                value={startTime}
                                onChangeText={setStartTime}
                                placeholder="09:00"
                                keyboardType="numbers-and-punctuation"
                                maxLength={5}
                                inputStyle={styles.timeInput}
                                style={styles.timeBox}
                            />
                        </View>
                        <Ionicons name="arrow-forward" size={22} color={palette.ink} style={{ marginTop: 22 }} />
                        <View style={styles.timeField}>
                            <Txt v="label">Until</Txt>
                            <Field
                                value={endTime}
                                onChangeText={setEndTime}
                                placeholder="17:00"
                                keyboardType="numbers-and-punctuation"
                                maxLength={5}
                                inputStyle={styles.timeInput}
                                style={styles.timeBox}
                            />
                        </View>
                    </View>

                    <View style={styles.daysRow}>
                        {DAYS.map(day => {
                            const on = selectedDays.includes(day.value);
                            return (
                                <Pressable
                                    key={day.value}
                                    style={[styles.dayChip, on && styles.dayChipActive]}
                                    onPress={() => toggleDay(day.value)}
                                    accessibilityRole="checkbox"
                                    accessibilityState={{ checked: on }}
                                >
                                    <Text style={[styles.dayText, on && styles.dayTextActive]}>{day.label}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </Card>

                <SectionLabel style={styles.gap}>{`Apps to mute · ${blockedApps.length}`}</SectionLabel>
                <Field
                    icon="search"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Find an app"
                    autoCorrect={false}
                    style={{ marginBottom: 12 }}
                />

                <Card padded={false} style={{ overflow: 'hidden' }}>
                    {filteredApps.slice(0, 10).map((app, i, list) => {
                        const muted = blockedApps.includes(app.packageName);
                        return (
                            <Pressable
                                key={app.packageName}
                                style={[styles.appItem, muted && styles.appItemMuted, i === list.length - 1 && { borderBottomWidth: 0 }]}
                                onPress={() => toggleAppBlock(app.packageName)}
                            >
                                <View style={styles.appInfo}>
                                    <Txt v="h3" numberOfLines={1} style={{ textTransform: 'capitalize' }}>
                                        {app.appName || app.packageName.split('.').pop()}
                                    </Txt>
                                    <Text style={styles.packageName} numberOfLines={1}>{app.packageName}</Text>
                                </View>
                                <Toggle
                                    value={muted}
                                    onValueChange={() => toggleAppBlock(app.packageName)}
                                    tone="tomato"
                                    label={`Mute ${app.appName || app.packageName}`}
                                />
                            </Pressable>
                        );
                    })}
                    {filteredApps.length > 10 && (
                        <Text style={styles.moreApps}>{filteredApps.length - 10} more · search to find them</Text>
                    )}
                    {filteredApps.length === 0 && (
                        <Text style={styles.moreApps}>No app matches that.</Text>
                    )}
                </Card>

                {existingMode && (
                    <Pressable style={styles.deleteButton} onPress={handleDelete} accessibilityRole="button">
                        <Ionicons name="trash-outline" size={18} color={palette.tomato} />
                        <Text style={styles.deleteText}>Delete this schedule</Text>
                    </Pressable>
                )}
            </ScrollView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: TAB_BAR_SPACE,
    },
    gap: {
        marginTop: 24,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 18,
    },
    timeField: {
        flex: 1,
        gap: 6,
    },
    timeBox: {
        height: 64,
        backgroundColor: palette.paper,
    },
    timeInput: {
        fontFamily: font.display,
        fontSize: 28,
        textAlign: 'center',
    },
    daysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dayChip: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: stroke,
        borderColor: palette.ink,
        backgroundColor: palette.card,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayChipActive: {
        backgroundColor: palette.ink,
    },
    dayText: {
        fontFamily: font.bodyBold,
        color: palette.ink,
        fontSize: 14,
    },
    dayTextActive: {
        color: palette.card,
    },
    appItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: stroke,
        borderBottomColor: palette.ink,
    },
    appItemMuted: {
        backgroundColor: palette.peach,
    },
    appInfo: {
        flex: 1,
        marginRight: 12,
    },
    packageName: {
        fontFamily: font.mono,
        color: palette.inkSoft,
        fontSize: 11,
        marginTop: 1,
    },
    moreApps: {
        fontFamily: font.mono,
        textAlign: 'center',
        padding: 14,
        color: palette.inkSoft,
        fontSize: 12,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        padding: 14,
        gap: 8,
    },
    deleteText: {
        fontFamily: font.bodyBold,
        color: palette.tomato,
        fontSize: 15,
        textDecorationLine: 'underline',
    },
});

export default FocusModeDetail;
