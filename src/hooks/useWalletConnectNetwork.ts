import { useEffect } from 'react';

import { getChainId } from '@/constants/wallet-connect.js';
import { setNetwork, selectNetwork, type ChiaNetwork } from '@/state/walletConnectNetworkSlice.js';
import { useAppDispatch, useAppSelector } from '@/state/store.js';
import store from '@/state/store.js';
import { createLogger } from '@/utils/logger.js';

const logger = createLogger('useWalletConnectNetwork');

/**
 * Hook to get and set the WalletConnect network (mainnet/testnet).
 * 
 * The network defaults to 'mainnet' and can be changed at runtime.
 * On first use, if the network hasn't been set in Redux, it will be initialized
 * from environment variables (NEXT_PUBLIC_CHIA_NETWORK or CHIA_NETWORK).
 * 
 * @returns Object with network, setNetwork function, and chainId
 * 
 * @example
 * ```tsx
 * const { network, setNetwork, chainId } = useWalletConnectNetwork();
 * 
 * // Switch to testnet
 * setNetwork('testnet');
 * 
 * ```
 */
export function useWalletConnectNetwork(): {
  network: ChiaNetwork;
  setNetwork: (network: ChiaNetwork) => void;
  chainId: string;
} {
  // Hooks must be called unconditionally - always call them first
  const dispatch = useAppDispatch();
  const network = useAppSelector(selectNetwork);

  // Initialize from environment variable on first mount if network is still at default
  useEffect(() => {
    // Skip during SSR
    if (typeof window === 'undefined') {
      return;
    }
    // Check if we need to initialize from env var
    // We'll check the current state to see if it's been set
    const state = store.getState();
    const currentNetwork = state.walletConnectNetwork?.network;
    
    // If network is still at default (mainnet) and we have an env var that says testnet,
    // initialize from env var
    if (currentNetwork === 'mainnet') {
      const envNetwork = process.env.NEXT_PUBLIC_CHIA_NETWORK || process.env.CHIA_NETWORK;
      if (envNetwork === 'testnet') {
        dispatch(setNetwork('testnet'));
      }
      // If envNetwork is 'mainnet' or undefined, we keep the default 'mainnet'
    }
  }, [dispatch]);

  const handleSetNetwork = (newNetwork: ChiaNetwork) => {
    // Validate network value
    if (newNetwork !== 'mainnet' && newNetwork !== 'testnet') {
      logger.error(`Invalid network value: ${newNetwork}. Must be 'mainnet' or 'testnet'.`);
      return;
    }
    dispatch(setNetwork(newNetwork));
  };

  // Get chain ID with error handling
  let chainId: string;
  try {
    chainId = getChainId(network);
    // Validate chain ID
    if (!chainId || (chainId !== 'chia:mainnet' && chainId !== 'chia:testnet')) {
      logger.error(`Invalid chain ID generated: ${chainId}. Defaulting to mainnet.`);
      chainId = getChainId('mainnet');
    }
  } catch (error) {
    logger.error('Error getting chain ID:', error);
    // Fallback to mainnet on error
    chainId = getChainId('mainnet');
  }

  return {
    network,
    setNetwork: handleSetNetwork,
    chainId,
  };
}
