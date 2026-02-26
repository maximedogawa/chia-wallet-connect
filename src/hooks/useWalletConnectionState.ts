import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { SessionTypes } from '@walletconnect/types';

import type { RootState } from '@/state/store.js';

/**
 * Hook to easily access wallet connection state.
 * Provides a simple API for apps to check if a wallet is connected
 * and access connection details.
 * 
 * @returns Object with connection state information
 */
export function useWalletConnectionState(): {
  /** Whether any wallet is connected */
  isConnected: boolean;
  /** The name of the connected wallet (e.g., "WalletConnect") or null */
  connectedWallet: string | null;
  /** The wallet address or null */
  address: string | null;
  /** Whether WalletConnect is the connected wallet */
  isWalletConnect: boolean;
  /** The active WalletConnect session or null */
  walletConnectSession: SessionTypes.Struct | null;
  /** The wallet image/icon URL or null */
  walletImage: string | null;
  /** The wallet name or null */
  walletName: string | null;
  /** The CNS name (if available) or null */
  cnsName: string | null;
} {
  const connectedWallet = useSelector((state: RootState) => state.wallet.connectedWallet);
  const address = useSelector((state: RootState) => state.wallet.address);
  const walletImage = useSelector((state: RootState) => state.wallet.image);
  const walletName = useSelector((state: RootState) => state.wallet.name);
  const cnsName = useSelector((state: RootState) => state.wallet.CNSName);
  const walletConnectSelectedSession = useSelector((state: RootState) => state.walletConnect.selectedSession);
  const _walletConnectSessions = useSelector((state: RootState) => state.walletConnect.sessions);
  
  // Compute derived state
  const isWalletConnect = connectedWallet === "WalletConnect";
  
  // For WalletConnect, we need both connectedWallet and selectedSession to be truthy
  // For other wallets, just check connectedWallet
  const isConnected = useMemo(() => {
    if (isWalletConnect) {
      return Boolean(walletConnectSelectedSession);
    }
    return Boolean(connectedWallet);
  }, [isWalletConnect, connectedWallet, walletConnectSelectedSession]);
  
  // Get the active WalletConnect session
  const walletConnectSession = useMemo(() => {
    if (isWalletConnect && walletConnectSelectedSession) {
      return walletConnectSelectedSession;
    }
    return null;
  }, [isWalletConnect, walletConnectSelectedSession]);
  
  return {
    isConnected,
    connectedWallet,
    address,
    isWalletConnect,
    walletConnectSession,
    walletImage,
    walletName,
    cnsName,
  };
}

