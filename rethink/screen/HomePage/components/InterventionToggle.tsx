import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, IconTile, Toggle, Txt } from '../../../ui/kit';
import { palette } from '../../../ui/theme';
import { useIntervention } from '../../../context/InterventionContext';
import PermissionManager from '../../../utils/PermissionManager';
import AccessibilityDisclosure from '../../Intervention/AccessibilityDisclosure';

interface InterventionToggleProps {
    /** When set, toggles the mindful pause for this one app instead of the whole feature. */
    packageName?: string;
}

const InterventionToggle: React.FC<InterventionToggleProps> = ({ packageName }) => {
    const { isInterventionEnabled, setIsInterventionEnabled, isMonitored, setAppMonitored } = useIntervention();
    const [showDisclosure, setShowDisclosure] = useState(false);

    const isOn = packageName ? isInterventionEnabled && isMonitored(packageName) : isInterventionEnabled;

    const turnOn = () => {
        if (packageName) setAppMonitored(packageName, true);
        setIsInterventionEnabled(true);
    };

    const handleToggle = async (value: boolean) => {
        if (!value) {
            if (packageName) setAppMonitored(packageName, false);
            else setIsInterventionEnabled(false);
            return;
        }

        if (await PermissionManager.checkAccessibilityPermission()) {
            turnOn();
            return;
        }

        // Play policy: explain and get consent before sending the user to accessibility settings.
        if (await PermissionManager.hasAcceptedDisclosure()) {
            turnOn();
            await PermissionManager.requestAccessibilityPermission();
        } else {
            setShowDisclosure(true);
        }
    };

    const handleAcceptDisclosure = async () => {
        setShowDisclosure(false);
        await PermissionManager.acceptDisclosure();
        turnOn();
        await PermissionManager.requestAccessibilityPermission();
    };

    return (
        <Card tone={isOn ? 'lilac' : 'card'} style={styles.container}>
            <IconTile icon={isOn ? 'leaf' : 'leaf-outline'} tone={isOn ? 'card' : 'lilac'} size={44} />
            <View style={styles.textContainer}>
                <Txt v="h3">Breathe before opening</Txt>
                <Txt v="small" style={isOn && styles.onInk}>
                    {packageName
                        ? 'A few slow breaths every time you open this app'
                        : 'A few slow breaths before the apps you pick'}
                </Txt>
            </View>
            <Toggle value={isOn} onValueChange={handleToggle} tone="mint" label="Breathe before opening" />
            <AccessibilityDisclosure
                visible={showDisclosure}
                onAccept={handleAcceptDisclosure}
                onDecline={() => setShowDisclosure(false)}
            />
        </Card>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 22,
        padding: 14,
    },
    textContainer: {
        flex: 1,
        marginHorizontal: 12,
    },
    onInk: {
        color: palette.ink,
    },
});

export default InterventionToggle;
