import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, TextInput, FlatList, ActivityIndicator } from "react-native";
import AnimatedModal from "./AnimatedModal";
import { Feather } from '@expo/vector-icons';
import ExerciseInfoModal from "./ExerciseInfoModal";

interface ExerciseTranslation {
  id: number;
  name: string;
  language: number;
}

interface ExerciseCategory {
  id: number;
  name: string;
}

interface Muscle {
  id: number;
  name: string;
  name_en: string;
  is_front: boolean;
  image_url_main: string;
  image_url_secondary: string;
}

interface Equipment {
  id: number;
  name: string;
}

interface ExerciseVideo {
  id: number;
  video: string; 
}
interface ExerciseImage {
  id: number;
  image: string; 
}


export interface WgerExercise {
  id: number;
  name: string;
  translations?: ExerciseTranslation[];
  category?: ExerciseCategory;
  displayName?: string; 
  muscles?: Muscle[];
  muscles_secondary?: Muscle[];
  equipment?: Equipment[];
  videos?: ExerciseVideo[];
  description?: string;
  images?: ExerciseImage[];
}

interface ExersizePanelProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (exercise: WgerExercise) => void;
}

export default function ExersizePanel({ isVisible, onClose, onSelect }: ExersizePanelProps) {
  const [exercises, setExercises] = useState<WgerExercise[]>([]);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>("https://wger.de/api/v2/exerciseinfo/?language=2");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [exerciseInfo, setExerciseInfo] = useState<WgerExercise | null>(null)
  
  const lastQueryRef = useRef("");
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchExercises = async (targetUrl: string | null = nextPageUrl, queryOverride?: string) => {
    const url = targetUrl || nextPageUrl;
    const activeQuery = queryOverride !== undefined ? queryOverride : searchQuery;

    if (isLoading || !url) return;
    if (activeQuery !== lastQueryRef.current) return;

    setIsLoading(true);
    try {
      const response = await fetch(url);
      const json = await response.json();

      if (activeQuery !== lastQueryRef.current) {
        setIsLoading(false);
        return;
      }

      const cleanedBatch = json.results
        .map((item: any) => {
          const englishEntry = item.translations?.find((t: any) => t.language === 2);
          const rawName = englishEntry?.name || item.name;

          if (!rawName || !/[a-zA-Z]/.test(rawName)) return null;

          const cleanName = rawName
            .toLowerCase()
            .split(' ')
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');

            const cleanDescription = englishEntry?.description || item.description;

          return { ...item, displayName: cleanName, description: cleanDescription };
        })
        .filter((item: any): item is WgerExercise => {
          if (!item) return false;
          
          if (activeQuery.trim().length > 0) {
            return item.displayName!.toLowerCase().includes(activeQuery.toLowerCase().trim());
          }

          return true;
        });

      setExercises(prev => {
        if (activeQuery !== lastQueryRef.current && activeQuery !== "") return prev;

        const existingNames = new Set(prev.map(ex => ex.displayName));
        
        const uniqueNewItems = cleanedBatch.filter(
          (item: WgerExercise) => !existingNames.has(item.displayName)
        );

        return [...prev, ...uniqueNewItems];
      });

      setNextPageUrl(json.next);
    } catch (error) {
      console.error("Network Error: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text); 

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }


    searchTimerRef.current = setTimeout(() => {
      lastQueryRef.current = text;
      setExercises([]); 
      
      const newUrl = text.trim().length > 0 
        ? `https://wger.de/api/v2/exerciseinfo/?name__search=${text}&language=2`
        : `https://wger.de/api/v2/exerciseinfo/?language=2`;

      setNextPageUrl(newUrl);
      fetchExercises(newUrl, text);
    }, 500);
  };

  useEffect(() => {
    if (isVisible && exercises.length === 0) {
      fetchExercises();
    }
  }, [isVisible]);


  return (
    <AnimatedModal isVisible={isVisible} onClose={onClose}>
      <View className="flex-1 w-full mt-2">
        <Text className="text-white text-2xl font-bold mb-4 px-2">Select Exercise</Text>

        <View className="px-2 mb-4">
          <TextInput
            className="bg-zinc-800 text-white p-4 rounded-2xl border border-zinc-700"
            placeholder="Search (e.g. Bench Press)"
            placeholderTextColor="#71717a"
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus={true} 
          />
        </View>

        <FlatList
          data={exercises}
          keyExtractor={(item, index) => item.id.toString() + index}
          renderItem={({item}) => (
            <View className="flex-row items-center justify-between p-4 mb-2 bg-zinc-800 rounded-xl mx-2">
                <Pressable 
                className="flex-1 active:opacity-70"
                onPress={() => {
                    onSelect(item);
                    onClose();
                }}
                >
                <Text className="text-white font-medium text-lg">{item.displayName}</Text>
                <Text className="text-zinc-500 text-sm">{item.category?.name}</Text>
                </Pressable>

                <Pressable 
                    className="p-3 bg-zinc-700 rounded-full ml-3 active:bg-zinc-600"
                    onPress={() => setExerciseInfo(item)}
                >
                    <Feather name="info" size={20} color="#60a5fa" />
                </Pressable>

            </View>


          )}
          onEndReached={() => {
            if (!isLoading && nextPageUrl) {
              fetchExercises(nextPageUrl, searchQuery);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => (
            isLoading ? <ActivityIndicator className="my-4" color="#3b82f6" /> : <View className="h-10" />
          )}
        />
      </View>

      <ExerciseInfoModal
        exercise={exerciseInfo}
        onClose={() => setExerciseInfo(null)}
      />

    </AnimatedModal>
  );
}