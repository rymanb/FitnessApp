import {View, Text, ScrollView} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GreetUser } from '@/components/GreetUser';
import { AccountButton } from '@/components/AccountButton';

export const Dashboard = () => {
  return (
    <SafeAreaView className={styles.mainContainer}>
        <View className={styles.userContainer}>
                <AccountButton onPress={() => {}}/>
                <GreetUser />
        </View>

    </SafeAreaView>
  );
};

const styles = {
    mainContainer: `flex-1 bg-zinc-950 `,
    headerText: `text-white p-5`,
    userContainer: 'flex-row justify-between items-center px-5 pb-5 w-full'
}
