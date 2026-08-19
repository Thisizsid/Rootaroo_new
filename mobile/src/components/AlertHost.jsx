import React, { useEffect, useState, useCallback } from 'react';
import AlertModal from './AlertModal';
import { registerAlertHandler } from '../shared/services/themedAlert';

/** Mount once near the app root. Backs the global showAlert() service. */
export default function AlertHost() {
  const [state, setState] = useState(null);

  useEffect(() => {
    registerAlertHandler((title, message, buttons) => {
      setState({ title, message, buttons });
    });
  }, []);

  const close = useCallback(() => setState(null), []);

  const handleRequestClose = useCallback(() => {
    const cancelBtn = state?.buttons?.find((b) => b.style === 'cancel');
    close();
    cancelBtn?.onPress?.();
  }, [state, close]);

  return (
    <AlertModal
      visible={!!state}
      title={state?.title}
      message={state?.message}
      buttons={state?.buttons}
      onRequestClose={handleRequestClose}
    />
  );
}
