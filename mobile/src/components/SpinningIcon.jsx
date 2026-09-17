import React, { useEffect, useRef } from 'react';
import { Animated, Image } from 'react-native';

/**
 * A continuously-rotating icon — used in place of a generic ActivityIndicator
 * where the icon itself (e.g. a provider logo) should read as "loading."
 */
export default function SpinningIcon({ source, size = 20 }) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ width: size, height: size, transform: [{ rotate }] }}>
      <Image source={source} style={{ width: size, height: size }} />
    </Animated.View>
  );
}
