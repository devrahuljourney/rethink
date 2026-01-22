import { View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native'
import React from 'react'
import { color } from '../constant/color'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/navigationTypes'


export default function Splash() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.heading}>
                <Text style={styles.headingHighlight}>Re</Text>Think
            </Text>

            <View style={styles.descriptionContainer}>
                <Text style={styles.header}>Take control of your <Text style={styles.headingHighlight}>screen time</Text></Text>
                <Text style={styles.description}>
                    Block distractions and create space to think before you open apps.
                </Text>

            </View>

            <View style={styles.visualWrapper}>
                <View style={styles.glowLayer1} />
                <View style={styles.glowLayer2} />

                <Image
                    style={styles.image}
                    source={require('../assets/1.png')}
                />
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.lines}>
                    <View style={styles.line} />
                    <View style={styles.line} />
                    <View style={styles.line} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('MainTab', { screen: 'HomeStack' })} style={styles.button}>

                    <Text style={styles.buttonText}>Next</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: color.black,
        alignItems: 'center',
        justifyContent: 'space-evenly',
    },

    heading: {
        fontSize: 26,
        fontWeight: '700',
        color: color.white,
    },

    headingHighlight: {
        color: color.primary,
    },

    descriptionContainer: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },

    header: {
        fontSize: 30,
        fontWeight: '700',
        color: color.white,
        textAlign: 'center',
    },

    description: {
        fontSize: 16,
        color: color.secondary,
        textAlign: 'center',
        marginTop: 4,
    },


    visualWrapper: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginVertical: 20,
    },

    glowLayer1: {
        position: 'absolute',
        width: 380,
        height: 380,
        borderRadius: 190,
        backgroundColor: '#3f4a45',
        opacity: 0.18,

        shadowColor: '#3f4a45',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 120,

        elevation: 1,
    },

    glowLayer2: {
        position: 'absolute',
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: '#4b5a54',
        opacity: 0.25,

        shadowColor: '#4b5a54',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 80,

        elevation: 2,
    },

    image: {
        width: '80%',
        height: 200,
        resizeMode: 'contain',
        zIndex: 10,
    },


    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '90%',
        alignItems: 'center',
    },

    lines: {
        flexDirection: 'row',
        width: 50,
        justifyContent: 'space-between',
    },

    line: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: color.secondary,
    },

    button: {
        backgroundColor: color.primary,
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 8,
    },

    buttonText: {
        color: color.black,
        fontSize: 16,
        fontWeight: '700',
    },
})
