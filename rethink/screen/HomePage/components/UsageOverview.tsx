import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { color } from '../../../constant/color';

interface UsageOverviewProps {
    totalUsage: string;
    mostUsedApp: string;
    mostLaunches: string;
    launches: number;
    avgUsage?: string;
    activeRange: string;
}

const { width } = Dimensions.get('window');

const UsageOverview: React.FC<UsageOverviewProps> = ({
    totalUsage,
    mostUsedApp,
    mostLaunches,
    launches,
    avgUsage,
    activeRange
}) => {
    return (
        <View style={styles.container}>
            {/* Hero Card */}
            <View style={styles.heroCard}>
                <View style={styles.heroHeader}>
                    <Text style={styles.heroLabel}>Total Usage Time</Text>
                    <View style={styles.liveIndicator}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>{activeRange === 'DAILY' ? 'Today' : activeRange === 'WEEKLY' ? 'This Week' : 'This Month'}</Text>
                    </View>
                </View>
                <Text style={styles.heroValue}>{totalUsage}</Text>
                {avgUsage && (
                    <View style={[styles.avgContainer, { backgroundColor: avgUsage.includes('Down') ? 'rgba(52, 199, 89, 0.05)' : avgUsage.includes('Up') ? 'rgba(255, 82, 82, 0.05)' : 'rgba(255, 255, 255, 0.05)' }]}>
                        <Ionicons
                            name={avgUsage.includes('Down') ? "trending-down" : avgUsage.includes('Up') ? "trending-up" : "remove-outline"}
                            size={14}
                            color={avgUsage.includes('Down') ? "#34C759" : avgUsage.includes('Up') ? "#FF5252" : color.secondary}
                        />
                        <Text style={[styles.avgText, { color: avgUsage.includes('Down') ? "#34C759" : avgUsage.includes('Up') ? "#FF5252" : color.secondary }]}>
                            {avgUsage}
                        </Text>
                    </View>
                )}
                <View style={styles.heroFooter}>
                    <Ionicons name="trending-up" size={16} color={color.primary} />
                    <Text style={styles.heroSubtext}>Tracking active app sessions</Text>
                </View>
            </View>

            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <View style={[styles.statIconContainer, { backgroundColor: 'rgba(167, 139, 255, 0.1)' }]}>
                        <Ionicons name="rocket-outline" size={20} color="#A78BFF" />
                    </View>
                    <View>
                        <Text style={styles.statValueCompact}>{launches}</Text>
                        <Text style={styles.statLabelCompact}>Launches</Text>
                    </View>
                </View>

                <View style={styles.statCard}>
                    <View style={[styles.statIconContainer, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
                        <Ionicons name="apps-outline" size={20} color="#34C759" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.statValueCompact} numberOfLines={1}>{mostUsedApp}</Text>
                        <Text style={styles.statLabelCompact}>Top App</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    heroCard: {
        backgroundColor: '#1E1E1E',
        borderRadius: 24,
        padding: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    heroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    heroLabel: {
        color: color.secondary,
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(52, 199, 89, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#34C759',
        marginRight: 6,
    },
    liveText: {
        color: '#34C759',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    heroValue: {
        color: color.white,
        fontSize: 36,
        fontWeight: '800',
        marginBottom: 12,
    },
    heroFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    heroSubtext: {
        color: color.secondary,
        fontSize: 13,
        marginLeft: 6,
    },
    avgContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: 'rgba(52, 199, 89, 0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    avgText: {
        color: color.primary,
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statCard: {
        width: (width - 40 - 12) / 2,
        backgroundColor: '#1E1E1E',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    statValueCompact: {
        color: color.white,
        fontSize: 16,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    statLabelCompact: {
        color: color.secondary,
        fontSize: 11,
        marginTop: 1,
    },
});

export default UsageOverview;
