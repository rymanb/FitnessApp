import { useEffect, useRef } from 'react';
import { Modal, View, Animated, PanResponder, Dimensions } from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;


interface AnimatedModalProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  heightClass?: string
}

export default function AnimatedModal({isVisible, onClose, children, className="bg-zinc-900 rounded-t-3xl p-6", heightClass="h-[90%]"} : AnimatedModalProps) {
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isVisible) {
            translateY.setValue(0);
        }
    }, [isVisible]);

    const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const dragDistance = Math.max(0, gestureState.dy);
        translateY.setValue(dragDistance);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 1) {
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onClose());
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end">
                <Animated.View 
                    className={`${className} ${heightClass}`}
                    style={{ transform: [{ translateY: translateY }] }}
                >
            <View 
                {...panResponder.panHandlers} 
                className="w-full py-4 items-center"
            >
                <View className="w-12 h-1.5 bg-zinc-700 rounded-full" />
            </View>
                    {children}    
                </Animated.View>
            </View>

        </Modal>
    );
}