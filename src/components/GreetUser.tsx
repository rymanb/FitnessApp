import { View } from 'react-native';
import { useAuth } from '@/context/AppContext';
import { Text } from '@/components/ui/Typography';

const getTimeOfDayGreeting = (): string => {
    const currentHour = new Date().getHours();
    if (currentHour >= 5 && currentHour <= 12) return "Good morning";
    if (currentHour >= 12 && currentHour <= 17) return "Good afternoon";
    return "Good evening";
};

export const GreetUser = () => {
    const {user} = useAuth();
    const dynamicGreeting = getTimeOfDayGreeting();

    const name = user?.givenName || user?.name || 'User';
    const maxNameLen = 12;
    const displayName = name.length > maxNameLen ? `${name.substring(0, maxNameLen)}...` : name;

    return (
        <View className="flex-1 p-5">
            <Text color="muted" className="font-mono text-xl">{dynamicGreeting}!</Text>
            <Text variant="h2" className="font-mono mt-1">{displayName}</Text>
        </View>
    );
}