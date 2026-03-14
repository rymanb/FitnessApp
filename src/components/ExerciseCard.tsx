import { PlannedExercise } from "@/types";
import { View, Pressable, TextInput } from "react-native";
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Typography';

interface ExerciseCardProps {
    exercise: PlannedExercise;
    onRemove: () => void;
    onAddSet: () => void;
    onRemoveSet: (setId: string) => void;
    onUpdateSet: (setId: string, field: 'weight' | 'reps', value: string) => void;
    onToggleSetStatus?: (setId: string) => void;
}

export default function ExerciseCard({ 
  exercise, 
  onRemove, 
  onAddSet, 
  onRemoveSet, 
  onUpdateSet,
  onToggleSetStatus
}: ExerciseCardProps) {

return (
    <View className="bg-surface-dark border border-surface p-4 rounded-2xl mb-6">
      
      <View className="flex-row items-center mb-4">
        <View className="flex-1 ml-3">
          <Text variant="body" className="font-bold" numberOfLines={1}>
            {exercise.wgerData.displayName}
          </Text>
        </View>
        <Pressable onPress={onRemove} className="p-2 active:bg-surface rounded-full">
          <Feather name="trash-2" size={18} color="#ef4444" />
        </Pressable>
      </View>

      <View className="flex-row px-2 mb-2">
        <Text color="dark" variant="caption" className="w-10 text-center uppercase tracking-widest">Set</Text>
        <Text color="dark" variant="caption" className="flex-1 text-center uppercase tracking-widest">lbs</Text>
        <Text color="dark" variant="caption" className="flex-1 text-center uppercase tracking-widest">Reps</Text>
        <View className="w-10" /> 
      </View>

      {exercise.sets.map((set, setIndex) => (
        <View key={set.id} className="flex-row items-center bg-background rounded-xl mb-2 py-1 px-2 border border-surface/50">
          <View className="w-10 items-center justify-center">
            <Text color="muted" className="font-bold">{setIndex + 1}</Text>
          </View>
          
          <View className="flex-1 px-2">
            <TextInput
              value={set.weight}
              onChangeText={(text) => onUpdateSet(set.id, 'weight', text)}
              keyboardType="numeric"
              placeholder="-"
              placeholderTextColor="#52525b"
              className="bg-surface-dark text-text font-medium text-center rounded-lg py-2"
            />
          </View>

          <View className="flex-1 px-2">
            <TextInput
              value={set.reps}
              onChangeText={(text) => onUpdateSet(set.id, 'reps', text)}
              keyboardType="numeric"
              placeholder="-"
              placeholderTextColor="#52525b"
              className="bg-surface-dark text-text font-medium text-center rounded-lg py-2"
            />
          </View>

          <Pressable 
            onPress={() => onRemoveSet(set.id)}
            className="w-10 h-10 items-center justify-center rounded-xl active:bg-surface-dark"
          >
            <Feather name="minus" size={16} color="#52525b" />
          </Pressable>
          {onToggleSetStatus && (
            <Pressable 
                onPress={() => onToggleSetStatus(set.id)}
                className={`w-10 h-10 rounded-lg items-center justify-center ${
                    set.completed ? 'bg-green-600' : 'bg-surface border border-surface-light'
                }`}
            >
                <Feather 
                    name="check" 
                    size={20} 
                    color={set.completed ? "white" : "#3f3f46"} 
                />
            </Pressable>
        )}
        </View>
      ))}

      <Pressable 
        onPress={onAddSet}
        className="mt-2 py-2 items-center justify-center rounded-xl bg-surface/50 active:bg-surface"
      >
        <Text color="primary" className="font-medium">+ Add Set</Text>
      </Pressable>

    </View>
    );
}