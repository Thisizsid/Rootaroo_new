import React, { useEffect, useState, useCallback, useRef } from 'react';
import PermissionSheet from './PermissionSheet';
import { registerPermissionHandler } from '../shared/services/permissionGate';

/** Mount once near the app root, alongside AlertHost. Backs showPermissionSheet(). */
export default function PermissionHost() {
  const [content, setContent] = useState(null);
  // Held separately from `content` so resolving survives the state clear.
  const resolveRef = useRef(null);

  useEffect(() => {
    registerPermissionHandler((next, resolve) => {
      resolveRef.current = resolve;
      setContent(next);
    });
  }, []);

  const settle = useCallback((action) => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setContent(null);
    resolve?.(action);
  }, []);

  const handleAllow = useCallback(() => settle('retry'), [settle]);
  const handleDismiss = useCallback(() => settle('dismiss'), [settle]);

  return (
    <PermissionSheet
      visible={!!content}
      content={content}
      onAllow={handleAllow}
      onDismiss={handleDismiss}
    />
  );
}
