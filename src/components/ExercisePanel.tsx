import { useEffect, useState } from "react";
import { View, Pressable, TextInput, FlatList, ActivityIndicator } from "react-native";
import AnimatedModal from "./AnimatedModal";
import { Feather } from '@expo/vector-icons';
import ExerciseInfoModal from "./ExerciseInfoModal";
import { WgerExercise } from "@/types";
import { Text } from '@/components/ui/Typography';
import { useWgerSearch } from "@/hooks/useWgerSearch";

interface ExersizePanelProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (exercise: WgerExercise) => void;
}

export default function ExersizePanel({ isVisible, onClose, onSelect }: ExersizePanelProps) {
  const { exercises, isLoading, searchQuery, handleSearch, loadMore, fetchInitial } = useWgerSearch();
  const [exerciseInfo, setExerciseInfo] = useState<WgerExercise | null>(null);

  useEffect(() => {
    if (isVisible && exercises.length === 0) {
      fetchInitial();
    }
  }, [isVisible]);

  return (
    <>
      <AnimatedModal isVisible={isVisible} onClose={onClose}>
        <View className="flex-1 w-full mt-2">
          <Text variant="h2" className="mb-4 px-2">Select Exercise</Text>

          <View className="px-2 mb-4">
            <TextInput
              className="bg-surface border border-surface-light text-text p-4 rounded-2xl"
              placeholder="Search (e.g. Bench Press)"
              placeholderTextColor="#a1a1aa"
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus={true} 
            />
          </View>

          <FlatList
            data={exercises}
            keyExtractor={(item, index) => item.id.toString() + index}
            renderItem={({item}) => (
              <View className="flex-row items-center justify-between p-4 mb-2 bg-surface rounded-xl mx-2">
                  <Pressable 
                    className="flex-1 active:opacity-70"
                    onPress={() => { onSelect(item); onClose(); }}
                  >
                    <Text variant="h3">{item.displayName}</Text>
                    <Text color="muted" variant="caption" className="mt-1">{item.category?.name}</Text>
                  </Pressable>

                  <Pressable 
                      className="p-3 bg-surface-light rounded-full ml-3 active:bg-surface-dark"
                      onPress={() => setExerciseInfo(item)}
                  >
                      <Feather name="info" size={20} color="#60a5fa" />
                  </Pressable>
              </View>
            )}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => (
              isLoading ? <ActivityIndicator className="my-4" color="#3b82f6" /> : <View className="h-10" />
            )}
          />
        </View>
      </AnimatedModal>

      {!!exerciseInfo && (
          <ExerciseInfoModal
            exercise={exerciseInfo}
            onClose={() => setExerciseInfo(null)}
            onSelect={(exercise) => {
                setExerciseInfo(null);
                onSelect(exercise);
            }}
          />
      )}
    </>
  );
}