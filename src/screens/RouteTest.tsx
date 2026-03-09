import {View, Text, ScrollView} from 'react-native';

export const RouteTest = () => {
  return (
    <View className={styles.mainContainer}>
        {/* Header */}
        <View className={styles.header}>

        </View>
    </View>
  );
};

const styles = {
    mainContainer: `flex-1 bg-blue-500`,
    header: `px-6 py-6 bg-slate-900 rounded-b-3xl`,
}
