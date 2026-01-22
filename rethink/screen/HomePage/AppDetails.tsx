import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { color } from '../../constant/color';

const AppDetails = () => {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { packageName } = route.params;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={color.white} />
                </TouchableOpacity>
                <Text style={styles.title}>App Details</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.iconPlaceholder}>
                    <Text style={styles.iconText}>{packageName.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.appName}>{packageName.split('.').pop()}</Text>
                <Text style={styles.packageName}>{packageName}</Text>

                <View style={styles.placeholderCard}>
                    <Text style={styles.placeholderText}>Detailed insights for this app coming soon...</Text>
                </View>
            </View>
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
        flex: 1,
        alignItems: 'center',
        paddingTop: 40,
    },
    iconPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: '#1E1E1E',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    iconText: {
        color: color.white,
        fontSize: 32,
        fontWeight: '800',
    },
    appName: {
        color: color.white,
        fontSize: 24,
        fontWeight: '800',
        textTransform: 'capitalize',
    },
    packageName: {
        color: color.secondary,
        fontSize: 14,
        marginTop: 4,
    },
    placeholderCard: {
        marginTop: 40,
        marginHorizontal: 24,
        backgroundColor: '#1E1E1E',
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        width: '80%',
        alignItems: 'center',
    },
    placeholderText: {
        color: color.secondary,
        textAlign: 'center',
        fontSize: 14,
    },
});

export default AppDetails;
