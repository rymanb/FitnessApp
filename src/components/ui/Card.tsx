import { Pressable, PressableProps } from 'react-native';

interface CardProps extends PressableProps {
    className?: string;
    children: React.ReactNode;
}

export function Card({ children, className = '', onPress, ...props }: CardProps) {
    const baseStyle = "bg-card rounded-3xl border border-card-light shadow-sm";
    
    // Automatically add padding if not overridden
    const paddingStyle = className.includes('p-') ? '' : 'p-5';
    
    // Automatically add click-feedback if the card is interactive
    const activeStyle = onPress ? 'active:bg-card-light' : '';

    return (
        <Pressable 
            onPress={onPress}
            className={`${baseStyle} ${paddingStyle} ${activeStyle} ${className}`} 
            {...props}
        >
            {children}
        </Pressable>
    );
}