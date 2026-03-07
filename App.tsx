import {Dashboard} from './src/screens/Dashboard';

import './global.css';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView className={styles.safeArea}>
        <Dashboard />
      </SafeAreaView>

    </SafeAreaProvider>
  );
}

const styles = {
  safeArea: `flex-1 bg-zinc-950`,
};
