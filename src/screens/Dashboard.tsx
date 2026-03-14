import { View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GreetUser } from '@/components/GreetUser';
import { AccountButton } from '@/components/AccountButton';
import { useState } from 'react';
import PlanPanel from '@/components/PlanPanel';
import { usePlanStore } from '@/store/planStore';
import PlanCard from '@/components/PlanCard'; 

// IMPORT THE PRIMITIVE!
import { Text } from '@/components/ui/Typography';

export const Dashboard = () => {
    const { savedPlans } = usePlanStore(); 

    const [isPanelVisible, setIsPanelVisible] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any | null>(null);

    const handleCreateNewPlan = () => {
        setSelectedPlan(null);
        setIsPanelVisible(true);
    }

    const handleOpenExistingPlan = (plan: any) => {
        setSelectedPlan(plan);
        setIsPanelVisible(true);
    }

    return (
        <SafeAreaView className="flex-1 bg-background p-4">
            <View className="flex-row justify-between items-center mb-8 mt-4">
                <AccountButton onPress={() => {}}/>
                <GreetUser />
            </View>

            <View className="flex-1 pb-4">
                <ScrollView showsVerticalScrollIndicator={false}>
                    {savedPlans.length === 0 ? (
                        <View className="items-center justify-center py-10">
                            <Text color="muted" variant="h3">No plans saved yet.</Text>
                            <Text color="dark" variant="caption" className="mt-2">Open the planner to create one!</Text>
                        </View>
                    ) : (
                        savedPlans.map((plan) => (
                            <PlanCard 
                                key={plan.id} 
                                plan={plan} 
                                onEdit={() => handleOpenExistingPlan(plan)} 
                            />
                        ))
                    )}
                </ScrollView>

                <Pressable onPress={handleCreateNewPlan}> 
                    <Text variant="h1" className="mb-6 mt-4">Create Plan</Text>
                </Pressable>

                {isPanelVisible && (
                    <PlanPanel
                        isVisible={true} 
                        onClose={() => setIsPanelVisible(false)}
                        existingPlan={selectedPlan} 
                    />
                )}
            </View>
        </SafeAreaView>
    );
};