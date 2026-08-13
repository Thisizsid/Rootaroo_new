import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Real-time network connectivity status (drives the OfflineBanner).
 * `isOffline` is true when the device is disconnected or the internet is
 * unreachable. `isConnected` is the raw device connection state (null before
 * the first event).
 */
export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState(false);
  const [isConnected, setIsConnected] = useState(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      setIsOffline(!online);
      setIsConnected(state.isConnected ?? null);
    });
    return unsubscribe;
  }, []);

  return { isOffline, isConnected };
}
