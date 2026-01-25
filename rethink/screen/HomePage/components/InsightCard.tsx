import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { color } from '../../../constant/color';

interface InsightCardProps {
    icon: string;
    title: string;
    value: string;
    subtitle: string;
    type?: 'positive' | 'negative' | 'neutral';
}

const InsightCard: React.FC<InsightCardProps> = ({ icon, title, value, subtitle, type = 'neutral' }) => {
    const getAccentColor = () => {
        if (type === 'positive') return '#34C759';
        if (type === 'negative') return '#FF3B30';
        return color.primary;
    };

    return (
        <View style={styles.container}>
            <View style={[styles.iconContainer, { backgroundColor: `${getAccentColor()}15` }]}>
                <Ionicons name={icon} size={20} color={getAccentColor()} />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.value}>{value}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1E1E1E',
        borderRadius: 20,
        padding: 16,
        marginHorizontal: 24,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2A2A2A',
        width: '88%',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        color: color.secondary,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
    },
    value: {
        color: color.white,
        fontSize: 18,
        fontWeight: '700',
    },
    subtitle: {
        color: color.secondary,
        fontSize: 11,
        marginTop: 2,
    },
});

export default InsightCard;
