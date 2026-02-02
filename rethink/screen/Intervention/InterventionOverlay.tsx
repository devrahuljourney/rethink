import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { color } from '../../constant/color';
import { useIntervention } from '../../context/InterventionContext';
import { useUsage } from '../../context/UsageContext';
import { useAppLimits } from '../../context/AppLimitContext';
import { formatTime } from '../../utils/timeUtils';
import { getCategoryColor, getCategoryIcon } from '../../utils/categoryMapper';

const { height, width } = Dimensions.get('window');

const InterventionOverlay: React.FC = () => {
    const { resetIntervention, currentTriggerApp } = useIntervention();
    const { usageData, getAppCategory } = useUsage();
    const { getLimitStatus } = useAppLimits();
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(height));

    // Get real usage data for the current app
    const appData = usageData.find(app => app.packageName === currentTriggerApp);
    const limitStatus = currentTriggerApp ? getLimitStatus(currentTriggerApp) : null;
    const category = currentTriggerApp ? getAppCategory(currentTriggerApp) : null;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleContinue = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: height,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            resetIntervention();
        });
    };

    const getAppName = (packageName: string | null) => {
        if (!packageName) return 'this app';

        // Try to get from usage data first
        const app = usageData.find(a => a.packageName === packageName);
        if (app?.appName) return app.appName;

        // Fallback to common names
        if (packageName.includes('youtube')) return 'YouTube';
        if (packageName.includes('instagram')) return 'Instagram';
        if (packageName.includes('facebook')) return 'Facebook';
        if (packageName.includes('photos')) return 'Photos';
        if (packageName.includes('tiktok')) return 'TikTok';
        return packageName.split('.').pop() || 'this app';
    };

    const usageTimeMs = appData?.totalTimeInForeground || 0;
    const launches = appData?.appLaunchCount || 0;

    return (
        <View style={styles.overlay}>
            <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <View style={styles.header}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="leaf-outline" size={40} color="#34C759" />
                    </View>
                    <Text style={styles.title}>Take a Breath</Text>
                    <Text style={styles.subtitle}>
                        You are about to open <Text style={styles.appName}>{getAppName(currentTriggerApp)}</Text>.
                        Do you really need to use it right now?
                    </Text>

                    {category && (
                        <View style={[styles.categoryBadge, { backgroundColor: `${getCategoryColor(category)}20` }]}>
                            <Ionicons name={getCategoryIcon(category)} size={14} color={getCategoryColor(category)} />
                            <Text style={[styles.categoryText, { color: getCategoryColor(category) }]}>
                                {category}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{formatTime(usageTimeMs)}</Text>
                        <Text style={styles.statLabel}>Today</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{launches}</Text>
                        <Text style={styles.statLabel}>Opens</Text>
                    </View>
                </View>

                {limitStatus && (
                    <View style={styles.limitInfo}>
                        <View style={styles.limitBar}>
                            <View
                                style={[
                                    styles.limitProgress,
                                    {
                                        width: `${Math.min(100, limitStatus.percentageUsed)}%`,
                                        backgroundColor: limitStatus.isWarning ? '#FF9500' : '#34C759'
                                    }
                                ]}
                            />
                        </View>
                        <Text style={styles.limitText}>
                            {limitStatus.isBlocked
                                ? 'Daily limit reached!'
                                : `${Math.round(limitStatus.percentageUsed)}% of daily limit used`
                            }
                        </Text>
                    </View>
                )}

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.primaryButton]}
                        onPress={handleContinue}
                    >
                        <Text style={styles.primaryButtonText}>I really need this</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.secondaryButton]}
                        onPress={() => resetIntervention()}
                    >
                        <Text style={styles.secondaryButtonText}>Close app</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.footerText}>Rethink your digital habits</Text>
            </Animated.View>
        </View>
    );
};


const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    container: {
        width: width * 0.85,
        backgroundColor: '#1E1E1E',
        borderRadius: 32,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(52, 199, 89, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        color: '#34C759',
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 10,
    },
    subtitle: {
        color: '#AAA',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
    },
    appName: {
        color: '#FFF',
        fontWeight: '700',
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginTop: 12,
        gap: 6,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#2A2A2A',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        width: '100%',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '700',
    },
    statLabel: {
        color: '#888',
        fontSize: 12,
        marginTop: 4,
    },
    divider: {
        width: 1,
        height: '100%',
        backgroundColor: '#444',
    },
    limitInfo: {
        width: '100%',
        marginBottom: 20,
    },
    limitBar: {
        width: '100%',
        height: 8,
        backgroundColor: '#2A2A2A',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    limitProgress: {
        height: '100%',
        borderRadius: 4,
    },
    limitText: {
        color: '#AAA',
        fontSize: 12,
        textAlign: 'center',
    },
    buttonContainer: {
        width: '100%',
        gap: 12,
    },
    button: {
        width: '100%',
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: '#34C759',
    },
    primaryButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#444',
    },
    secondaryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    footerText: {
        color: '#555',
        fontSize: 12,
        marginTop: 24,
    }
});

export default InterventionOverlay;
