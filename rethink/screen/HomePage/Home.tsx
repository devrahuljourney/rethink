import { View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native'
import React from 'react'

const color = {
    primary: '#13DE67',
    secondary: '#444f4b',
    white: '#fff',
    black: '#080808',
}

export default function Home() {
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.heading} >Screen <Text style={styles.headingHighlight}>Fy</Text> </Text>
            <View style={styles.descriptionContainer} >
                <Text style={styles.description}>Your Screen Time OverView</Text>
                <Text style={styles.description}>View your screen time and compare the stats against your friends.</Text>
            </View>
            <View style={styles.imageContainer}>
                <Image style={styles.image} source={require('../../assets/1.png')} />
            </View>
            <View style={styles.buttonContainer} >
                <TouchableOpacity style={styles.lines} >
                    <View style={styles.line}></View>
                    <View style={styles.line}></View>
                    <View style={styles.line}></View>

                </TouchableOpacity>
                <TouchableOpacity style={styles.button}>
                    Next
                </TouchableOpacity>
            </View>
            <View></View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-evenly',
        alignItems: 'center',
        backgroundColor: color.black,
        color: color.white,
    },
    heading: {
        fontSize: 24,
        fontWeight: 'bold',
        color: color.white,
    },
    headingHighlight: {
        color: color.primary,
    },
    descriptionContainer: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    description: {
        fontSize: 16,
        color: color.secondary,
    },
    imageContainer: {
        width: '80%',
        height: 200,
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    line: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: color.secondary,
    },
    lines: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: 50, // Increased width
        // height: 10, // Removed fixed height constraint or kept it
    },
    button: {
        backgroundColor: color.primary,
        padding: 10,
        borderRadius: 5,
    },
})