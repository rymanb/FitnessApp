import { View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccountButton } from '@/components/AccountButton';
import { useState } from 'react';
import PlanPanel from '@/components/PlanPanel';
import { usePlanStore } from '@/store/planStore';
import PlanCard from '@/components/PlanCard';
import { Text } from '@/components/ui/Typography';
import { useAuth } from '@/context/AppContext';
import { Feather } from '@expo/vector-icons';
import ActivityChart from '@/components/ActivityChart';
import { useRouter } from 'expo-router';

const getGreeting = (): string => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Good morning";
    if (h >= 12 && h <= 17) return "Good afternoon";
    return "Good evening";
};

export const Dashboard = () => {
    const { user } = useAuth();
    const router = useRouter();
    const allPlans = usePlanStore(state => state.savedPlans);
    const savedPlans = allPlans.filter(plan => !plan.isDeleted);

    const [isPanelVisible, setIsPanelVisible] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any | null>(null);

    const handleCreateNewPlan = () => {
        setSelectedPlan(null);
        setIsPanelVisible(true);
    };

    const handleOpenExistingPlan = (plan: any) => {
        setSelectedPlan(plan);
        setIsPanelVisible(true);
    };

    const name = user?.givenName || user?.name?.split(' ')[0] || 'there';

    return (
        <SafeAreaView className="flex-1 bg-background">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>

                {/* Top bar: greeting left, avatar right */}
                <View className="flex-row justify-between items-center mt-4 mb-6">
                    <View>
                        <Text color="muted" variant="caption" className="font-mono uppercase tracking-widest">
                            {getGreeting()}
                        </Text>
                        <Text variant="h1" className="font-mono mt-0.5">{name}</Text>
                    </View>
                    <AccountButton onPress={() => router.push('/profile')} />
                </View>

                {/* Consistency calendar */}
                <ActivityChart />

                {/* My Plans header */}
                <View className="flex-row justify-between items-center mb-3 mt-2">
                    <Text variant="h2">My Plans</Text>
                    <Pressable
                        onPress={handleCreateNewPlan}
                        className="w-9 h-9 rounded-full bg-primary items-center justify-center active:bg-primary-dark"
                    >
                        <Feather name="plus" size={20} color="white" />
                    </Pressable>
                </View>

                {/* Plan list */}
                {savedPlans.length === 0 ? (
                    <Pressable onPress={handleCreateNewPlan} className="items-center justify-center py-12 border-2 border-dashed border-surface rounded-3xl mt-2">
                        <Feather name="plus-circle" size={36} color="#3f3f46" />
                        <Text color="muted" variant="h3" className="mt-3">No plans yet</Text>
                        <Text color="dark" variant="caption" className="mt-1">Tap to create your first plan</Text>
                    </Pressable>
                ) : (
                    savedPlans.map((plan) => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            onEdit={() => handleOpenExistingPlan(plan)}
                        />
                    ))
                )}

                <View className="h-6" />
            </ScrollView>

            {isPanelVisible && (
                <PlanPanel
                    isVisible={true}
                    onClose={() => setIsPanelVisible(false)}
                    existingPlan={selectedPlan}
                />
            )}
        </SafeAreaView>
    );
};
