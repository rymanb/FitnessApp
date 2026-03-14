import { useAuth } from "@/context/AppContext";
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

export function AccountButton({onPress}: {onPress: () => void}) {
    const {user} = useAuth();

    return (
        <TouchableOpacity onPress={onPress}>
            {user?.photo ? (
                <Image 
                    source={{uri: user.photo}}
                    style={{ width: 40, height: 40, borderRadius: 20 }} 
                    className="bg-surface-light"
                />
            ) : (
                <View className="w-10 h-10 rounded-full bg-surface-light justify-center items-center">
                    <Ionicons name="person" size={20} color="#a1a1aa" /> 
                </View>
            )}
        </TouchableOpacity>
    );
}