import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: { email?: string } | undefined;
  VerifyCode: { email: string };
  ResetPassword: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Subjects: undefined;
  Schedule: undefined;
  Profile: undefined;
};

/** The tab navigator plus the screens and modals presented over it. */
export type AppStackParamList = {
  Tabs: NavigatorScreenParams<AppTabParamList>;
};

export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type TabScreenProps<T extends keyof AppTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<AppTabParamList, T>,
  NativeStackScreenProps<AppStackParamList>
>;
