import {View, Text, ScrollView, Pressable} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GreetUser } from '@/components/GreetUser';
import { AccountButton } from '@/components/AccountButton';
import { useState } from 'react';
import PlanPanel from '@/components/PlanPanel';

export const Dashboard = () => {
    const [isCreatingPlan, setIsCreatingPlan] = useState(false);

  return (
    <SafeAreaView className={styles.mainContainer}>
        <View className={styles.userContainer}>
                <AccountButton onPress={() => {}}/>
                <GreetUser />
        </View>

        <View>
            <Pressable onPress={() => setIsCreatingPlan(true)}>
                <Text className={styles.headerText}>Create Plan</Text>
            </Pressable>

            {isCreatingPlan && (
                <PlanPanel
                    isVisible={isCreatingPlan}
                    onClose={() => setIsCreatingPlan(false)}
                />
            )}

            
        </View>

    </SafeAreaView>
  );
};

const styles = {
    mainContainer: `flex-1 bg-zinc-950 `,
    headerText: `text-white p-5`,
    userContainer: 'flex-row justify-between items-center px-5 pb-5 w-full'
}
