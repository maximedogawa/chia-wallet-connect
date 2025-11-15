import { useEffect, useState } from 'react';
import { REHYDRATE } from 'redux-persist';

import store from '@/state/store.js';
import { restoreConnectionState, type RestoreConnectionStateOptions } from '@/utils/walletIntegration/restoreConnectionState.js';
import { createLogger } from '@/utils/logger.js';

const logger = createLogger('useWalletConnectRestore');

/**
 * Hook to restore WalletConnect connection state after Redux rehydration.
 * This hook should be used in your app's root component (e.g., _app.tsx).
 * 
 * It waits for Redux to finish rehydrating from IndexedDB, then restores
 * the WalletConnect connection state by syncing with the WalletConnect SDK.
 * 
 * @param options - Optional WalletConnect configuration
 * @returns Object with restoration state: { isRestoring, isRestored, error }
 */
export function useWalletConnectRestore(
  options: RestoreConnectionStateOptions = {}
): {
  isRestoring: boolean;
  isRestored: boolean;
  error: Error | null;
} {
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRestored, setIsRestored] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    // Check if we're in the browser (not SSR)
    if (typeof window === 'undefined') {
      return;
    }
    
    // Wait for Redux to finish rehydrating
    // We'll listen for the REHYDRATE action or check if state is already rehydrated
    const checkRehydration = () => {
      // Check if redux-persist has already rehydrated
      // The persistor state is stored in the store itself
      const state = store.getState();
      
      // If we have persisted state (not initial state), we're likely rehydrated
      // However, we need to wait for the actual rehydration to complete
      // We'll use a small delay to ensure PersistGate has completed
      // In practice, this hook should be used inside PersistGate
      
      // For now, we'll use a timeout to ensure rehydration is complete
      // A better approach would be to use PersistGate's onBeforeLift callback
      // but that requires the hook to be used differently
      
      // Check if restoration has already been attempted
      const restorationKey = '__walletConnect_restoration_attempted';
      if (sessionStorage.getItem(restorationKey)) {
        logger.debug('Restoration already attempted in this session');
        return;
      }
      
      // Small delay to ensure PersistGate has completed
      const timeoutId = setTimeout(async () => {
        try {
          setIsRestoring(true);
          setError(null);
          
          logger.debug('Starting WalletConnect connection state restoration...');
          
          await restoreConnectionState(options);
          
          setIsRestored(true);
          sessionStorage.setItem(restorationKey, 'true');
          logger.debug('WalletConnect connection state restoration completed');
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          logger.error('Error during WalletConnect restoration:', error);
        } finally {
          setIsRestoring(false);
        }
      }, 100); // Small delay to ensure rehydration is complete
      
      return () => clearTimeout(timeoutId);
    };
    
    // Listen for REHYDRATE action
    let unsubscribe: (() => void) | null = null;
    
    const setupListener = () => {
      unsubscribe = store.subscribe(() => {
        const state = store.getState();
        // Check if we can access the state (means rehydration likely completed)
        // This is a heuristic - in practice, PersistGate ensures rehydration
        if (state && !isRestored && !isRestoring) {
          checkRehydration();
        }
      });
    };
    
    // Start checking after a brief delay to allow PersistGate to initialize
    const initTimeout = setTimeout(() => {
      setupListener();
      checkRehydration();
    }, 50);
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      clearTimeout(initTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.walletConnectIcon, options.walletConnectMetadata]); // Re-run if options change
  
  return { isRestoring, isRestored, error };
}

/**
 * Alternative hook that can be used with PersistGate's onBeforeLift callback.
 * This is the recommended approach for more reliable restoration timing.
 * 
 * Usage:
 * ```tsx
 * <PersistGate 
 *   loading={null} 
 *   persistor={persistor}
 *   onBeforeLift={() => {
 *     restoreConnectionStateImmediate(options);
 *   }}
 * >
 *   ...
 * </PersistGate>
 * ```
 */
export async function restoreConnectionStateImmediate(
  options: RestoreConnectionStateOptions = {}
): Promise<void> {
  logger.debug('Starting immediate WalletConnect connection state restoration...');
  await restoreConnectionState(options);
  logger.debug('Immediate restoration completed');
}

