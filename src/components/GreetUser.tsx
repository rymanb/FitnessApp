import { View, Text } from 'react-native';
import { useAuth } from '@/context/AppContext';

const getTimeOfDayGreeting = (): string => {
    const currentHour = new Date().getHours();

    if (currentHour >= 5 && currentHour <= 12) {
        return "Good morning";
    }
    else if (currentHour >= 12 && currentHour <= 17) {
        return "Good afternoon";
    }
    else {
        return "Good evening";
    }
};

export const GreetUser = () => {
    const {user} = useAuth();
    const dynamicGreeting = getTimeOfDayGreeting();

    const name = user?.givenName || user?.name || 'User';
    const maxNameLen = 12;
    const displayName = name.length > maxNameLen ? `${name.substring(0, maxNameLen)}...` : name;


    return (
        <View className={styles.container} >
            <Text className={styles.greetText}>{dynamicGreeting}!</Text>
            <Text className={styles.userText}>{displayName}</Text>
        </View>
    );
}

const genericText = `font-mono text-xl`

const styles = {
    container: `flex-1 p-5`,

    greetText: `${genericText} text-zinc-300`,
    userText: `${genericText} text-white font-bold`
}