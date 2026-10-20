import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/navigationTypes'
import { Screen, Txt, Card, Sticker, IconTile, PopButton, Toggle } from '../ui/kit'
import { palette, font } from '../ui/theme'

export default function Splash() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    return (
        <Screen style={styles.container}>
            <View style={styles.brandRow}>
                <Text style={styles.wordmark}>
                    rethink<Text style={{ color: palette.tomato }}>.</Text>
                </Text>
                <Sticker text="for humans" tone="lilac" tilt={6} />
            </View>

            {/* A loose pile of the three things the app does. */}
            <View style={styles.collage} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <Card tone="sun" style={[styles.tile, styles.tileTime]}>
                    <Txt v="label" style={styles.inkLabel}>Screen time</Txt>
                    <Text style={styles.bigNumber}>2h 14m</Text>
                    <Txt v="small" style={styles.inkSmall}>where did the evening go?</Txt>
                </Card>

                <Card tone="tomato" style={[styles.tile, styles.tilePause]}>
                    <View style={styles.row}>
                        <IconTile icon="logo-instagram" tone="card" size={36} />
                        <View style={{ marginLeft: 10 }}>
                            <Txt v="h3">Hold on…</Txt>
                            <Txt v="small" style={styles.inkSmall}>breathe in, then decide</Txt>
                        </View>
                    </View>
                </Card>

                <Card tone="mint" style={[styles.tile, styles.tileFocus]}>
                    <View style={[styles.row, { justifyContent: 'space-between' }]}>
                        <View>
                            <Txt v="label" style={styles.inkLabel}>Focus</Txt>
                            <Txt v="h2">9:00 – 17:00</Txt>
                        </View>
                        <Toggle value onValueChange={() => { }} tone="card" />
                    </View>
                </Card>

                <Sticker text="no doomscroll" tone="cobalt" tilt={-8} style={styles.floatSticker} />
            </View>

            <View>
                <Text style={styles.headline}>
                    Pause before{'\n'}you <Text style={styles.highlight}>{'\u2009'}scroll{'\u2009'}</Text>.
                </Text>
                <Txt style={styles.body}>
                    Rethink puts a short breath in front of the apps that eat your day, and shows you where the hours
                    actually go.
                </Txt>
                <PopButton
                    title="Let's go"
                    icon="arrow-forward"
                    tone="ink"
                    onPress={() => navigation.replace('MainTab')}
                />
            </View>
        </Screen>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        paddingBottom: 28,
        justifyContent: 'space-between',
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    wordmark: {
        fontFamily: font.display,
        fontSize: 30,
        color: palette.ink,
        letterSpacing: -1,
    },

    collage: {
        height: 320,
        marginVertical: 8,
    },
    tile: {
        position: 'absolute',
    },
    tileTime: {
        top: 8,
        left: 0,
        width: '62%',
        transform: [{ rotate: '-5deg' }],
    },
    tilePause: {
        top: 118,
        right: 0,
        width: '64%',
        transform: [{ rotate: '4deg' }],
    },
    tileFocus: {
        bottom: 6,
        left: 8,
        width: '70%',
        transform: [{ rotate: '-2deg' }],
    },
    floatSticker: {
        position: 'absolute',
        top: 20,
        right: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    inkLabel: { color: palette.ink },
    inkSmall: { color: palette.ink },
    bigNumber: {
        fontFamily: font.display,
        fontSize: 40,
        lineHeight: 46,
        color: palette.ink,
        letterSpacing: -1,
        marginVertical: 2,
    },

    headline: {
        fontFamily: font.display,
        fontSize: 44,
        lineHeight: 50,
        color: palette.ink,
        letterSpacing: -1.5,
    },
    highlight: {
        backgroundColor: palette.sun,
    },
    body: {
        marginTop: 12,
        marginBottom: 24,
        fontSize: 16,
        lineHeight: 23,
    },
})
