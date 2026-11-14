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
  /** `date` (YYYY-MM-DD) selects the day to show, e.g. when coming back from Calendar. */
  Schedule: { date?: string } | undefined;
  Profile: undefined;
};

/** The tab navigator plus the screens and modals presented over it. */
export type AppStackParamList = {
  Tabs: NavigatorScreenParams<AppTabParamList>;
  SubjectDetail: { subjectId: string };
  /** Modal. Without `subjectId` it creates a subject. */
  SubjectForm: { subjectId?: string } | undefined;
  /** Modal. `eventId` edits; `date` and `subjectId` prefill a new event. */
  EventForm: { eventId?: string; date?: string; subjectId?: string } | undefined;
  /** Modal. */
  TaskForm: { date?: string; subjectId?: string } | undefined;
  Calendar: { date?: string } | undefined;
  EditProfile: undefined;
  Reminders: undefined;
  ChangePassword: undefined;
  Help: undefined;
  Terms: undefined;
};

export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type AppScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>;

export type TabScreenProps<T extends keyof AppTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<AppTabParamList, T>,
  NativeStackScreenProps<AppStackParamList>
>;
