import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusMode } from '../../context/FocusModeContext';
import { FocusMode } from '../../types/appLimits';
import GuardStatusBanner from '../Intervention/GuardStatusBanner';
import { Rise } from '../../ui/motion';
import { Screen, Txt, Card, Sticker, PopButton, Toggle, SectionLabel } from '../../ui/kit';
import { palette, font, stroke, TAB_BAR_SPACE } from '../../ui/theme';

const WEEK = [
    { label: 'M', value: 1 },
    { label: 'T', value: 2 },
    { label: 'W', value: 3 },
    { label: 'T', value: 4 },
    { label: 'F', value: 5 },
    { label: 'S', value: 6 },
    { label: 'S', value: 0 },
];

const FocusModeScreen = () => {
    const navigation = useNavigation<any>();
    const { focusModes, toggleFocusMode } = useFocusMode();

    const renderMode = (item: FocusMode, index: number) => {
        const schedule = item.schedules?.[0];
        const days = schedule?.days ?? [];
        const blocked = item.blockedApps?.length || 0;

        return (
            <Rise key={item.id} delay={160 + index * 80}>
            <Card tone={item.enabled ? 'mint' : 'card'} padded={false} style={styles.modeCard}>
                <View style={styles.modeBody}>
                    <View style={styles.modeHeader}>
                        <Txt v="h2" style={{ flex: 1 }} numberOfLines={1}>{item.name || 'Untitled'}</Txt>
                        <Toggle
                            value={item.enabled}
                            onValueChange={(val) => toggleFocusMode(item.id, val)}
                            tone="sun"
                            label={`${item.name} on or off`}
                        />
                    </View>
                    <Text style={styles.modeTime}>
                        {schedule?.startTime || '09:00'}–{schedule?.endTime || '17:00'}
                    </Text>
                    <View style={styles.days}>
                        {WEEK.map((d, i) => {
                            const on = days.includes(d.value);
                            return (
                                <View key={i} style={[styles.day, on && styles.dayOn]}>
                                    <Text style={[styles.dayText, on && { color: palette.card }]}>{d.label}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
                <Pressable
                    style={styles.modeFooter}
                    onPress={() => navigation.navigate('FocusModeDetail', { focusModeId: item.id })}
                    accessibilityRole="button"
                >
                    <Text style={styles.mono}>
                        {blocked} app{blocked === 1 ? '' : 's'} on mute
                    </Text>
                    <Text style={styles.edit}>Edit</Text>
                </Pressable>
            </Card>
            </Rise>
        );
    };

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Rise style={styles.titleRow}>
                    <Txt v="display">Focus</Txt>
                    <Sticker text="quiet hours" tone="tomato" tilt={-6} style={{ marginLeft: 12 }} />
                </Rise>
                <Rise delay={60}>
                    <Txt style={styles.intro}>
                        Pick the apps that pull you away. During your hours they simply won't open.
                    </Txt>
                </Rise>

                <View style={{ marginHorizontal: -20 }}>
                    <GuardStatusBanner />
                </View>

                <SectionLabel
                    right={
                        focusModes.length > 0 ? (
                            <PopButton
                                small
                                tone="sun"
                                title="New"
                                icon="add"
                                onPress={() => navigation.navigate('FocusModeDetail')}
                            />
                        ) : undefined
                    }
                >
                    Your schedules
                </SectionLabel>

                {focusModes.length > 0 ? (
                    focusModes.map(renderMode)
                ) : (
                    <Rise delay={160}>
                    <Card style={styles.emptyState}>
                        <Txt v="h1" style={{ textAlign: 'center' }}>No quiet hours yet.</Txt>
                        <Txt style={styles.emptyText}>
                            Start with work hours or bedtime. You can change it whenever.
                        </Txt>
                        <PopButton
                            title="Make the first one"
                            tone="tomato"
                            icon="arrow-forward"
                            onPress={() => navigation.navigate('FocusModeDetail')}
                        />
                    </Card>
                    </Rise>
                )}
            </ScrollView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: TAB_BAR_SPACE,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    intro: {
        marginTop: 8,
        marginBottom: 22,
    },
    modeCard: {
        marginBottom: 14,
        overflow: 'hidden',
    },
    modeBody: {
        padding: 18,
    },
    modeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    modeTime: {
        fontFamily: font.display,
        fontSize: 36,
        lineHeight: 42,
        letterSpacing: -1,
        color: palette.ink,
        marginTop: 6,
    },
    days: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 12,
    },
    day: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: stroke,
        borderColor: palette.ink,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.card,
    },
    dayOn: {
        backgroundColor: palette.ink,
    },
    dayText: {
        fontFamily: font.bodyBold,
        fontSize: 12,
        color: palette.ink,
    },
    modeFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: stroke,
        borderColor: palette.ink,
        paddingHorizontal: 18,
        paddingVertical: 12,
        backgroundColor: palette.card,
    },
    mono: {
        fontFamily: font.mono,
        fontSize: 12,
        color: palette.ink,
    },
    edit: {
        fontFamily: font.bodyBold,
        fontSize: 14,
        color: palette.ink,
        textDecorationLine: 'underline',
    },
    emptyState: {
        alignItems: 'stretch',
        padding: 24,
        borderStyle: 'dashed',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 6,
        marginBottom: 20,
    },
});

export default FocusModeScreen;
