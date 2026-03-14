import { useState, useRef, useCallback } from 'react';
import { WgerExercise } from '@/types';

export function useWgerSearch() {
    const [exercises, setExercises] = useState<WgerExercise[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    
    const nextPageUrlRef = useRef<string | null>("https://wger.de/api/v2/exerciseinfo/?language=2");
    const lastQueryRef = useRef("");
    const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

    const fetchExercises = useCallback(async (isNewSearch = false, queryOverride?: string) => {
        const activeQuery = queryOverride !== undefined ? queryOverride : searchQuery;
        const targetUrl = isNewSearch 
            ? (activeQuery.trim().length > 0 
                ? `https://wger.de/api/v2/exerciseinfo/?name__search=${activeQuery}&language=2` 
                : `https://wger.de/api/v2/exerciseinfo/?language=2`)
            : nextPageUrlRef.current;

        if (isLoading || !targetUrl) return;
        if (activeQuery !== lastQueryRef.current && !isNewSearch) return;

        setIsLoading(true);
        try {
            const response = await fetch(targetUrl);
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
                    
                    const cleanName = rawName.toLowerCase().split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    const cleanDescription = englishEntry?.description || item.description;
                    
                    return { ...item, displayName: cleanName, description: cleanDescription };
                })
                .filter((item: any): item is WgerExercise => {
                    if (!item) return false;
                    if (activeQuery.trim().length > 0) return item.displayName!.toLowerCase().includes(activeQuery.toLowerCase().trim());
                    return true;
                });

            setExercises(prev => {
                if (isNewSearch) return cleanedBatch;
                const existingNames = new Set(prev.map(ex => ex.displayName));
                const uniqueNewItems = cleanedBatch.filter((item: WgerExercise) => !existingNames.has(item.displayName));
                return [...prev, ...uniqueNewItems];
            });

            nextPageUrlRef.current = json.next;
        } catch (error) {
            console.error("Network Error: ", error);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, searchQuery]);

    const handleSearch = (text: string) => {
        setSearchQuery(text); 
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

        searchTimerRef.current = setTimeout(() => {
            lastQueryRef.current = text;
            fetchExercises(true, text);
        }, 500);
    };

    const loadMore = () => {
        if (!isLoading && nextPageUrlRef.current) {
            fetchExercises(false);
        }
    };

    return {
        exercises,
        isLoading,
        searchQuery,
        handleSearch,
        loadMore,
        fetchInitial: () => fetchExercises(true, "")
    };
}