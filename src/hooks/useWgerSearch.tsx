import { useState } from 'react';
import { WgerExercise } from '@/types';
import ExerciseDB from '@/data/exercises.json';

export function useWgerSearch() {
    const [searchQuery, setSearchQuery] = useState("");

    const exercises: WgerExercise[] = ExerciseDB
        .filter((ex: any) => {
            const query = searchQuery.toLowerCase().trim();
            if (!query) return true;
            return ex.displayName?.toLowerCase().includes(query) ||
                   ex.name?.toLowerCase().includes(query);
        })
        .slice(0, 50)
        .map((ex: any) => ({
            id: ex.id,
            name: ex.name,
            displayName: ex.displayName || ex.name,
            description: ex.description || "",
            category: ex.category || { id: 1, name: "General" },
            muscles: ex.muscles || [],
            muscles_secondary: ex.muscles_secondary || [],
            equipment: ex.equipment || [],
            videos: ex.videos || [],
            images: ex.images || []
        }));

    const handleSearch = (text: string) => {
        setSearchQuery(text);
    };

    // loadMore and fetchInitial are no-ops since the full dataset is loaded locally from JSON
    return {
        exercises,
        isLoading: false,
        searchQuery,
        handleSearch,
        loadMore: () => {},
        fetchInitial: () => {}
    };
}
