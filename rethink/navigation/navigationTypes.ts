import { NavigatorScreenParams } from '@react-navigation/native';

export type HomeStackParamList = {
    Home: undefined;
};

export type AppStackParamList = {
    App: undefined;
};

export type SettingStackParamList = {
    Settings: undefined;
};

export type BottomTabParamList = {
    HomeStack: NavigatorScreenParams<HomeStackParamList> | undefined;
    AppStack: NavigatorScreenParams<AppStackParamList> | undefined;
    SettingStack: NavigatorScreenParams<SettingStackParamList> | undefined;
};

export type RootStackParamList = {
    Splash: undefined;
    MainTab: NavigatorScreenParams<BottomTabParamList> | undefined;
};
