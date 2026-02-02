import { NavigatorScreenParams } from '@react-navigation/native';

export type HomeStackParamList = {
    Home: undefined;
};

export type AppStackParamList = {
    App: undefined;
    AppDetails: { packageName: string };
    AppLimits: { packageName: string };
    FocusMode: undefined;
};


export type SettingStackParamList = {
    Settings: undefined;
};

export type BottomTabParamList = {
    HomeStack: NavigatorScreenParams<HomeStackParamList> | undefined;
    AppStack: NavigatorScreenParams<AppStackParamList> | undefined;
    SettingStack: NavigatorScreenParams<SettingStackParamList> | undefined;
};

export type AuthStackParamList = {
    Login: undefined;
    Signup: undefined;
};

export type RootStackParamList = {
    Splash: undefined;
    MainTab: NavigatorScreenParams<BottomTabParamList> | undefined;
    Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
};
