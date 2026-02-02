import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { color } from '../../constant/color';
import { useFocusMode } from '../../context/FocusModeContext';
import { useUsage } from '../../context/UsageContext';

const FocusModeScreen = () => {
    const navigation = useNavigation<any>();
    const { focusModes, toggleFocusMode } = useFocusMode();
    const { usageData } = useUsage();

    const [isGlobalEnabled, setIsGlobalEnabled] = useState(true);

    const renderFocusModeItem = ({ item }: { item: any }) => (
        <View style={styles.modeCard}>
            <View style={styles.modeHeader}>
                <View>
                    <Text style={styles.modeTitle}>{item.name || 'Custom Focus'}</Text>
                    <Text style={styles.modeSubtitle}>
                        {item.schedules?.[0]?.startTime || '09:00'} - {item.schedules?.[0]?.endTime || '17:00'}
                    </Text>
                </View>
                <Switch
                    value={item.enabled}
                    onValueChange={(val) => toggleFocusMode(item.id, val)}
                    trackColor={{ false: '#333', true: color.primary }}
                    thumbColor={color.white}
                />
            </View>
            <View style={styles.modeStats}>
                <Text style={styles.statsText}>{item.blockedApps?.length || 0} apps blocked</Text>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => navigation.navigate('FocusModeDetail', { focusModeId: item.id })}
                >
                    <Text style={styles.editButtonText}>Edit Schedule</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={color.white} />
                </TouchableOpacity>
                <Text style={styles.title}>Focus Mode</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.infoCard}>
                    <Ionicons name="shield-checkmark-outline" size={32} color={color.primary} />
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.infoTitle}>Stay Undisturbed</Text>
                        <Text style={styles.infoSubtitle}>Focus mode blocks distracting apps during your scheduled deep work hours.</Text>
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Your Focus Schedules</Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => navigation.navigate('FocusModeDetail')}
                    >
                        <Ionicons name="add" size={20} color={color.primary} />
                        <Text style={styles.addButtonText}>Add New</Text>
                    </TouchableOpacity>
                </View>

                {focusModes.length > 0 ? (
                    <FlatList
                        data={focusModes}
                        renderItem={renderFocusModeItem}
                        keyExtractor={item => item.id}
                        scrollEnabled={false}
                    />
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="cafe-outline" size={48} color="#333" style={{ marginBottom: 16 }} />
                        <Text style={styles.emptyText}>No focus schedules yet.</Text>
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={() => navigation.navigate('FocusModeDetail')}
                        >
                            <Text style={styles.createButtonText}>Create Your First Focus</Text>
                        </TouchableOpacity>
                    </View>
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
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#1E1E1E',
        padding: 20,
        borderRadius: 24,
        marginBottom: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    infoTextContainer: {
        marginLeft: 16,
        flex: 1,
    },
    infoTitle: {
        color: color.white,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    infoSubtitle: {
        color: color.secondary,
        fontSize: 13,
        lineHeight: 18,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        color: color.white,
        fontSize: 18,
        fontWeight: '700',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addButtonText: {
        color: color.primary,
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 4,
    },
    modeCard: {
        backgroundColor: '#1E1E1E',
        padding: 20,
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    modeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modeTitle: {
        color: color.white,
        fontSize: 16,
        fontWeight: '700',
    },
    modeSubtitle: {
        color: color.secondary,
        fontSize: 12,
        marginTop: 2,
    },
    modeStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#333',
        paddingTop: 16,
    },
    statsText: {
        color: color.secondary,
        fontSize: 12,
        fontWeight: '600',
    },
    editButton: {
        paddingVertical: 4,
    },
    editButtonText: {
        color: color.primary,
        fontSize: 13,
        fontWeight: '700',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#1A1A1A',
        borderRadius: 24,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#333',
    },
    emptyText: {
        color: color.secondary,
        fontSize: 14,
        marginBottom: 20,
    },
    createButton: {
        backgroundColor: 'rgba(52, 199, 89, 0.1)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    createButtonText: {
        color: color.primary,
        fontSize: 14,
        fontWeight: '700',
    },
});

export default FocusModeScreen;
