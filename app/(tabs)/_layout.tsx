import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import ActiveWorkoutModal from '@/components/ActiveWorkoutModal';

export default function TabLayout() {
  return (
    <>
    <Tabs screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9ca3af', 
        tabBarStyle: {
            backgroundColor: '#000000',
            borderTopColor: '#27272a',
            height: 60,
            paddingBottom: 8
        }
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: 'Hisotry',
          tabBarIcon: ({ color }) => <Feather name="clock" size={24} color={color} />,
        }}
      />

    </Tabs>
    <ActiveWorkoutModal />
    </>
  );
}