import { useAuth } from "@/context/AppContext";
import { TouchableOpacity, Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function AccountButton({onPress}: {onPress: () => void}) {
    const {user} = useAuth();

    return (
        <TouchableOpacity onPress={onPress}>
            {user?.photo ? (
                <Image 
                    source={{uri: user.photo}}
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#eee' }} 
                    />
            ) : (
                    <View style= {{width: 40, height: 40, borderRadius: 20, backgroundColor: '#eee', justifyContent: 'center', alignItems: "center"}}>
                        <Ionicons name="person" size={20} color="#999" />
                    </View>
            )}
        </TouchableOpacity>
    );
}