import { View, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '@/context/AppContext';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoogleSigninButton } from '@react-native-google-signin/google-signin';

export const Login = () => {
    const {login} = useAuth();

    return (
    <SafeAreaView className="flex-1 bg-background items-center justify-center p-8">
      <StatusBar style="light" />
      <GoogleSigninButton
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Dark}
        onPress={login}
        disabled={false} 
      />
    </SafeAreaView>
    );
}