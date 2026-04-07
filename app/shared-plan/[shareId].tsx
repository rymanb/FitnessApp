import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useShareStore } from '@/store/shareStore';

export default function SharedPlanRoute() {
    const { shareId } = useLocalSearchParams<{ shareId: string }>();
    const router = useRouter();
    const setPendingShareId = useShareStore(s => s.setPendingShareId);

    useEffect(() => {
        if (shareId) {
            setPendingShareId(shareId);
            router.replace('/');
        }
    }, [shareId]);

    return null;
}
