import { View, Text,StyleSheet } from 'react-native'
import React from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { color } from '../../constant/color'


export default function Home() {
  return (
    <View style={styles.container} >
      <Text>Home nn</Text>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: color.black,
        color: color.white,
    },
})
