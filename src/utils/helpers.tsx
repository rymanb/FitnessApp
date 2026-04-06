export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};