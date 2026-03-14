import { View, ViewProps } from 'react-native';
import { Text } from './Typography';

interface BadgeProps extends ViewProps {
    label: string;
    variant?: 'default' | 'primary' | 'danger' | 'warning' | 'success';
    className?: string;
}

export function Badge({ label, variant = 'default', className = '', ...props }: BadgeProps) {
    const baseStyle = "px-4 py-2 rounded-full border";
    
    const variantStyles = {
        default: "bg-surface-light border-surface-light", 
        primary: "bg-primary/20 border-primary/50",
        danger: "bg-red-500/20 border-red-500/50", 
        warning: "bg-orange-500/20 border-orange-500/50", 
        success: "bg-green-500/20 border-green-500/50",
    };

    const textColors = {
        default: "default",
        primary: "primary",
        danger: "danger",
        warning: "warning",
        success: "default", 
    } as const;

    return (
        <View className={`${baseStyle} ${variantStyles[variant]} ${className}`} {...props}>
            <Text color={textColors[variant]} className="font-medium">
                {label}
            </Text>
        </View>
    );
}