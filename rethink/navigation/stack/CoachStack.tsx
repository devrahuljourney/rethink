import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CoachStackParamList } from '../navigationTypes';
import AICoach from '../../screen/Coach/AICoach';

const Stack = createNativeStackNavigator<CoachStackParamList>();

export default function CoachStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AICoach" component={AICoach} />
        </Stack.Navigator>
    );
}
