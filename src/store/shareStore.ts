import { create } from 'zustand';

interface ShareStore {
    pendingShareId: string | null;
    setPendingShareId: (id: string | null) => void;
}

export const useShareStore = create<ShareStore>((set) => ({
    pendingShareId: null,
    setPendingShareId: (id) => set({ pendingShareId: id }),
}));
