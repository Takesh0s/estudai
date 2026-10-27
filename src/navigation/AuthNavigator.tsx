import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { VerifyCodeScreen } from '../screens/auth/VerifyCodeScreen';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

type AuthNavigatorProps = {
  /** Starts on ResetPassword when a recovery code has just been verified. */
  recovering: boolean;
};

export function AuthNavigator({ recovering }: AuthNavigatorProps) {
  return (
    <Stack.Navigator
      initialRouteName={recovering ? 'ResetPassword' : 'Login'}
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ gestureEnabled: false }} />
    </Stack.Navigator>
  );
}
