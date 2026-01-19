

import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import Home from './screen/HomePage/Home'

export default function App() {
    return (
        <View style={styles.container}>
            <Home />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // justifyContent: 'center', // constraints layout
        // alignItems: 'center', // constraints layout
    },
    text: {
        fontSize: 24,
    },
})