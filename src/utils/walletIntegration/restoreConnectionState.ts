import WalletConnect from './wallets/walletConnect.js';

import store from '@/state/store.js';
import { setAddress, setConnectedWallet } from '@/state/walletSlice.js';
import { selectSession, setSelectedFingerprint } from '@/state/walletConnectSlice.js';
import { createLogger } from '@/utils/logger.js';
import type { WalletConnectMetadata } from '@/constants/wallet-connect.js';

const logger = createLogger('RestoreConnectionState');

export interface RestoreConnectionStateOptions {
  walletConnectIcon?: string;
  walletConnectMetadata?: WalletConnectMetadata;
}

/**
 * Restores WalletConnect connection state after page refresh.
 * This function:
 * 1. Syncs WalletConnect sessions from SDK to Redux
 * 2. If connectedWallet === "WalletConnect" and sessions exist:
 *    - Validates and selects the appropriate session
 *    - Sets fingerprint if missing
 *    - Fetches and restores the address
 * 3. Handles edge cases (no sessions, invalid session, etc.)
 * 
 * @param options - Optional WalletConnect configuration
 * @returns Promise that resolves when restoration is complete
 */
// Track if restoration is in progress to prevent duplicate calls
let restorationInProgress = false;

export async function restoreConnectionState(
  options: RestoreConnectionStateOptions = {}
): Promise<void> {
  // Prevent duplicate restoration calls
  if (restorationInProgress) {
    logger.debug('Restoration already in progress, skipping duplicate call');
    return;
  }
  
  restorationInProgress = true;
  
  try {
    logger.debug('Starting connection state restoration...');
    
    const state = store.getState();
    const connectedWallet = state.wallet.connectedWallet;
    const persistedSessions = state.walletConnect.sessions;
    const persistedSelectedSession = state.walletConnect.selectedSession;
    
    // Create WalletConnect instance to sync sessions
    const walletConnect = new WalletConnect(
      options.walletConnectIcon,
      options.walletConnectMetadata
    );
    
    // Sync sessions from SDK to Redux
    await walletConnect.updateSessions();
    
    // Get updated state after sync
    const updatedState = store.getState();
    const actualSessions = updatedState.walletConnect.sessions;
    
    // If no sessions exist in SDK, clear connection if Redux thinks we're connected
    if (actualSessions.length === 0) {
      if (connectedWallet === "WalletConnect") {
        logger.warn('Clearing connection state - no sessions available in SDK');
        store.dispatch(setConnectedWallet(null));
        store.dispatch(setAddress(null));
      }
      return;
    }
    
    // Determine which session to use
    let sessionToUse = null;
    
    // If connectedWallet is already set, try to use persisted selectedSession
    if (connectedWallet === "WalletConnect" && persistedSelectedSession) {
      const validSession = actualSessions.find(s => s.topic === persistedSelectedSession.topic);
      if (validSession) {
        sessionToUse = validSession;
      }
    }
    
    // If no valid persisted session, use the first available session
    if (!sessionToUse && actualSessions.length > 0) {
      sessionToUse = actualSessions[0];
    }
    
    if (!sessionToUse) {
      if (connectedWallet === "WalletConnect") {
        logger.warn('No valid session found, clearing connection');
        store.dispatch(setConnectedWallet(null));
        store.dispatch(setAddress(null));
      }
      return;
    }
    
    // Select the session in Redux
    store.dispatch(selectSession(sessionToUse.topic));
    
    // Ensure fingerprint is set for this session
    const fingerprint = updatedState.walletConnect.selectedFingerprint[sessionToUse.topic];
    if (!fingerprint) {
      const defaultFingerprint = Number(sessionToUse.namespaces.chia.accounts[0].split(":")[2]);
      store.dispatch(setSelectedFingerprint({ 
        topic: sessionToUse.topic, 
        selectedFingerprint: defaultFingerprint 
      }));
    }
    
    // If connectedWallet is not set, restore it from the session
    if (connectedWallet !== "WalletConnect") {
      // Fetch address and set connectedWallet
      // Try Sage method first (chia_getAddress), then fallback to regular getAddress
      let address: string | null = null;
      try {
        // Try Sage method first (works for Sage wallets)
        try {
          address = await walletConnect.verifyConnectionWithSageMethod();
        } catch (sageError) {
          // Fallback to regular getAddress
          address = await walletConnect.getAddress();
        }
      } catch (error) {
        logger.debug('Address fetch failed during restoration, connection will still be restored', error);
      }
      
      // Set connectedWallet regardless of whether we got an address
      // The connection is valid even if address fetch fails
      const setConnectedWalletInfo = {
        wallet: "WalletConnect" as const,
        address: address,
        image: walletConnect.image,
        name: "WalletConnect"
      };
      store.dispatch(setConnectedWallet(setConnectedWalletInfo));
      
      if (address) {
        logger.info('Connection restored successfully', { 
          address: `${address.slice(0, 7)}...${address.slice(-4)}` 
        });
      } else {
        logger.info('Connection restored (address will be fetched when needed)');
      }
    } else {
      // Address is already set, just ensure it's still valid
      try {
        await walletConnect.getAddress();
      } catch (error) {
        // Address fetch failed but connection is still valid
        logger.debug('Address verification failed, but connection is still active', error);
      }
    }
  } catch (error) {
    logger.error('Error during connection state restoration:', error);
    // Don't throw - restoration failure shouldn't break the app
    // The user can still manually connect
  } finally {
    restorationInProgress = false;
  }
}

