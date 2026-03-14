import { Text as RNText, TextProps } from 'react-native';

interface TypographyProps extends TextProps {
    variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption';
    color?: 'default' | 'muted' | 'dark' | 'primary' | 'danger' | 'warning'; 
}

export function Text({ variant = 'body', color = 'default', className = '', ...props }: TypographyProps) {
    const variantStyles = {
        h1: 'text-3xl font-bold',
        h2: 'text-2xl font-bold',
        h3: 'text-xl font-bold',
        body: 'text-base font-medium',
        caption: 'text-sm font-medium',
    };

    const colorStyles = {
        default: 'text-text',
        muted: 'text-text-muted',
        dark: 'text-text-dark',
        primary: 'text-primary-light',
        danger: 'text-red-500',
        warning: 'text-orange-400',
    };

    const combinedStyles = `${variantStyles[variant]} ${colorStyles[color]} ${className}`;

    return <RNText className={combinedStyles} {...props} />;
}