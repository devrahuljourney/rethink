import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView, Pressable } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAppLimits } from '../../context/AppLimitContext';
import { useUsage } from '../../context/UsageContext';
import GuardStatusBanner from '../Intervention/GuardStatusBanner';
import { Screen, TopBar, Txt, Card, Chip, PopButton, SectionLabel } from '../../ui/kit';
import { palette, font, radius, stroke, TAB_BAR_SPACE } from '../../ui/theme';

const PRESETS = [
    { label: '15m', h: 0, m: 15 },
    { label: '30m', h: 0, m: 30 },
    { label: '1h', h: 1, m: 0 },
    { label: '2h', h: 2, m: 0 },
];

const AppLimits = () => {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { packageName } = route.params || {};
    const { addLimit, updateLimit, deleteLimit, limits } = useAppLimits();
    const { usageData } = useUsage();
    const appName = usageData.find(a => a.packageName === packageName)?.appName || packageName?.split('.').pop() || 'this app';

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
            Alert.alert('Zero minutes?', 'Pick at least one minute, or remove the limit instead.');
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
            Alert.alert('Not saved', 'Something went wrong saving this limit. Try again.');
        }
    };

    const handleDelete = async () => {
        if (!existingLimit) return;

        Alert.alert(
            'Remove limit?',
            `${appName} will have no daily cap.`,
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

    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;

    return (
        <Screen>
            <TopBar title={existingLimit ? 'Change limit' : 'New limit'} onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <GuardStatusBanner />

                <Txt v="display" style={styles.question}>
                    How long on <Text style={styles.highlight}> {appName} </Text> each day?
                </Txt>

                <Card style={styles.timeCard}>
                    <View style={styles.timeInputs}>
                        <View style={styles.timeField}>
                            <TextInput
                                style={styles.input}
                                value={hours}
                                onChangeText={setHours}
                                keyboardType="number-pad"
                                maxLength={2}
                                selectionColor={palette.cobalt}
                                accessibilityLabel="Hours"
                            />
                            <Txt v="label">hours</Txt>
                        </View>
                        <Text style={styles.colon}>:</Text>
                        <View style={styles.timeField}>
                            <TextInput
                                style={styles.input}
                                value={minutes}
                                onChangeText={setMinutes}
                                keyboardType="number-pad"
                                maxLength={2}
                                selectionColor={palette.cobalt}
                                accessibilityLabel="Minutes"
                            />
                            <Txt v="label">minutes</Txt>
                        </View>
                    </View>
                </Card>

                <SectionLabel style={{ marginTop: 18 }}>Quick picks</SectionLabel>
                <View style={styles.presets}>
                    {PRESETS.map(p => (
                        <Chip
                            key={p.label}
                            label={p.label}
                            tone="sun"
                            active={h === p.h && m === p.m}
                            onPress={() => {
                                setHours(String(p.h));
                                setMinutes(String(p.m));
                            }}
                            style={styles.preset}
                        />
                    ))}
                </View>

                <Txt v="small" style={{ marginTop: 18, marginBottom: 24 }}>
                    When the time runs out, {appName} is blocked for the rest of the day.
                </Txt>

                <PopButton title="Save limit" tone="mint" onPress={handleSave} />

                {existingLimit && (
                    <Pressable style={styles.deleteButton} onPress={handleDelete} accessibilityRole="button">
                        <Text style={styles.deleteButtonText}>Remove limit</Text>
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
    question: {
        marginBottom: 20,
    },
    highlight: {
        backgroundColor: palette.sun,
        textTransform: 'capitalize',
    },
    timeCard: {
        paddingVertical: 22,
    },
    timeInputs: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    timeField: {
        flex: 1,
        alignItems: 'center',
        gap: 8,
    },
    colon: {
        fontFamily: font.display,
        fontSize: 44,
        color: palette.ink,
        marginTop: 8,
    },
    input: {
        width: '86%',
        height: 84,
        borderRadius: radius.md,
        borderWidth: stroke,
        borderColor: palette.ink,
        backgroundColor: palette.paper,
        color: palette.ink,
        fontFamily: font.display,
        fontSize: 44,
        textAlign: 'center',
        paddingVertical: 0,
    },
    presets: {
        flexDirection: 'row',
        gap: 8,
    },
    preset: {
        flex: 1,
        alignItems: 'center',
    },
    deleteButton: {
        marginTop: 14,
        paddingVertical: 14,
        alignItems: 'center',
    },
    deleteButtonText: {
        fontFamily: font.bodyBold,
        color: palette.tomato,
        fontSize: 15,
        textDecorationLine: 'underline',
    },
});

export default AppLimits;
