import { Pressable, PressableProps } from 'react-native';
import { Text } from './Typography';

interface ButtonProps extends PressableProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    className?: string;
}

export function Button({ title, variant = 'primary', className = '', ...props }: ButtonProps) {
    const baseStyle = "px-4 py-4 rounded-2xl items-center justify-center active:opacity-80 flex-row";
    
    const variantStyles = {
        primary: "bg-primary active:bg-primary-dark",
        secondary: "bg-surface border border-surface-light active:bg-surface-light",
        danger: "bg-red-600 active:bg-red-700",
        ghost: "bg-transparent",
    };

    const textColors = {
        primary: "default",
        secondary: "default",
        danger: "default",
        ghost: "primary",
    } as const;

    return (
        <Pressable className={`${baseStyle} ${variantStyles[variant]} ${className}`} {...props}>
            <Text variant="h3" color={textColors[variant]}>{title}</Text>
        </Pressable>
    );
}