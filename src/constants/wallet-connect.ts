import { SageMethods } from './sage-methods'

import type { ChiaNetwork } from '@/state/walletConnectNetworkSlice.js'

// Chain IDs
export const CHIA_MAINNET_CHAIN_ID = 'chia:mainnet'
export const CHIA_TESTNET_CHAIN_ID = 'chia:testnet'

// Storage key
export const WALLET_CONNECT_STORAGE_KEY = 'walletconnect'

// Get chain ID based on network
export function getChainId(network: ChiaNetwork): string {
  return network === 'testnet' ? CHIA_TESTNET_CHAIN_ID : CHIA_MAINNET_CHAIN_ID
}

// Get chain ID from environment variable (for backward compatibility and initial setup)
export function getChainIdFromEnv(): string {
  const network = process.env.NEXT_PUBLIC_CHIA_NETWORK || process.env.CHIA_NETWORK || 'mainnet'
  return getChainId(network === 'testnet' ? 'testnet' : 'mainnet')
}

export const CHIA_CHAIN_ID = getChainIdFromEnv()

// Helper to parse icons from environment variable (comma-separated string or single string)
// Default: WalletConnect icon from public/assets
const getMetadataIcons = (): string[] => {
  const iconsEnv = process.env.NEXT_PUBLIC_WALLET_CONNECT_METADATA_ICONS ||
                   process.env.WALLET_CONNECT_METADATA_ICONS;

  if (iconsEnv) {
    return iconsEnv.includes(',')
      ? iconsEnv.split(',').map(icon => icon.trim())
      : [iconsEnv];
  }

  // Default: Use WalletConnect icon
  const defaultIcon = typeof window !== 'undefined'
    ? `${window.location.origin}/assets/walletconnect.svg`
    : '/assets/walletconnect.svg';

  return [defaultIcon];
};

// Metadata configuration (can be overridden via environment variables)
export const CHIA_METADATA = {
  name: process.env.NEXT_PUBLIC_WALLET_CONNECT_METADATA_NAME ||
        process.env.WALLET_CONNECT_METADATA_NAME ||
        'Wallet Connect',
  description: process.env.NEXT_PUBLIC_WALLET_CONNECT_METADATA_DESCRIPTION ||
               process.env.WALLET_CONNECT_METADATA_DESCRIPTION ||
               'Wallet Connect for Chia blockchain',
  url: process.env.NEXT_PUBLIC_WALLET_CONNECT_METADATA_URL ||
       process.env.WALLET_CONNECT_METADATA_URL ||
       (typeof window !== 'undefined' ? window.location.origin : 'https://example.com'),
  icons: getMetadataIcons(),
}

// Get required namespaces with Sage methods for a given chain ID
export function getRequiredNamespaces(chainId: string) {
  // Validate chain ID
  if (chainId !== CHIA_MAINNET_CHAIN_ID && chainId !== CHIA_TESTNET_CHAIN_ID) {
    throw new Error(`Invalid chain ID: ${chainId}. Must be either ${CHIA_MAINNET_CHAIN_ID} or ${CHIA_TESTNET_CHAIN_ID}`)
  }

  return {
    chia: {
      methods: [
        // CHIP-0002 Commands
        SageMethods.CHIP0002_CONNECT,
        SageMethods.CHIP0002_CHAIN_ID,
        SageMethods.CHIP0002_GET_PUBLIC_KEYS,
        SageMethods.CHIP0002_FILTER_UNLOCKED_COINS,
        SageMethods.CHIP0002_GET_ASSET_COINS,
        SageMethods.CHIP0002_GET_ASSET_BALANCE,
        SageMethods.CHIP0002_SIGN_COIN_SPENDS,
        SageMethods.CHIP0002_SIGN_MESSAGE,
        SageMethods.CHIP0002_SEND_TRANSACTION,
        // Chia-specific Commands
        SageMethods.CHIA_CREATE_OFFER,
        SageMethods.CHIA_TAKE_OFFER,
        SageMethods.CHIA_CANCEL_OFFER,
        SageMethods.CHIA_GET_NFTS,
        SageMethods.CHIA_SEND,
        SageMethods.CHIA_GET_ADDRESS,
        SageMethods.CHIA_SIGN_MESSAGE_BY_ADDRESS,
        SageMethods.CHIA_BULK_MINT_NFTS,
      ],
      chains: [chainId],
      events: ['chainChanged', 'accountsChanged'],
    },
  }
}

// Legacy export for backward compatibility (deprecated - use getRequiredNamespaces instead)
// This uses the environment-based chain ID
export const REQUIRED_NAMESPACES = getRequiredNamespaces(getChainIdFromEnv())

// Sign client configuration
export const SIGN_CLIENT_CONFIG = {
  projectId: process.env.WALLET_CONNECT_PROJECT_ID || process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  relayUrl: process.env.WALLET_CONNECT_RELAY_URL ||
            process.env.NEXT_PUBLIC_WALLET_CONNECT_RELAY_URL ||
            'wss://relay.walletconnect.com',
  metadata: CHIA_METADATA,
  // Logger level: "error" | "warn" | "info" | "debug" | "trace"
  // "error" is recommended - filters out non-critical internal WalletConnect errors
  // (pairing cleanup, history restore, etc.) that don't affect functionality
  logger: (process.env.WALLET_CONNECT_LOGGER ||
           process.env.NEXT_PUBLIC_WALLET_CONNECT_LOGGER ||
           'error') as 'error' | 'warn' | 'info' | 'debug' | 'trace',
}

// WalletConnect metadata interface for custom configuration
export interface WalletConnectMetadata {
  name?: string;
  description?: string;
  url?: string;
  icons?: string[];
}

// Default WalletConnect icon (can be overridden via environment variable or props)
export const WALLET_CONNECT_ICON = process.env.NEXT_PUBLIC_WALLET_CONNECT_ICON ||
                                    '/assets/walletconnect.svg';

// Default wallet image (alias for backward compatibility)
export const DEFAULT_WALLET_IMAGE = process.env.NEXT_PUBLIC_WALLET_CONNECT_DEFAULT_IMAGE ||
                                     process.env.WALLET_CONNECT_DEFAULT_IMAGE ||
                                     WALLET_CONNECT_ICON;

// WalletConnect Modal configuration (for desktop)
// Only used on desktop platforms, iOS uses custom modal
// Note: projectId must be defined - checked at runtime before modal initialization
// Theme is detected dynamically from the document's dark class
export function getModalConfig(chainId?: string) {
  const projectId = SIGN_CLIENT_CONFIG.projectId;
  if (!projectId) {
    return null;
  }

  // Use provided chainId or fall back to environment-based chain ID
  const finalChainId = chainId || getChainIdFromEnv();

  // Validate chain ID
  if (finalChainId !== CHIA_MAINNET_CHAIN_ID && finalChainId !== CHIA_TESTNET_CHAIN_ID) {
    console.error(`Invalid chain ID for modal config: ${finalChainId}. Using default.`);
    // Fall back to mainnet if invalid
    const fallbackChainId = CHIA_MAINNET_CHAIN_ID;
    return {
      projectId,
      chains: [fallbackChainId],
      themeMode: 'light' as const,
      themeVariables: {
        '--wcm-z-index': '9999',
        '--wcm-background-color': '#ffffff',
        '--wcm-accent-color': '#3b82f6',
        '--wcm-accent-fill-color': '#ffffff',
      },
    };
  }

  // Detect current theme from document (matches Tailwind's dark mode)
  let themeMode: 'light' | 'dark' = 'light';
  if (typeof window !== 'undefined') {
    const isDark = document.documentElement.classList.contains('dark');
    themeMode = isDark ? 'dark' : 'light';
  } else {
    // Fallback to environment variable or default to light
    const envTheme = process.env.NEXT_PUBLIC_WALLET_CONNECT_THEME;
    themeMode = (envTheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
  }

  return {
    projectId,
    chains: [finalChainId],
    themeMode,
    themeVariables: {
      '--wcm-z-index': '9999',
      '--wcm-background-color': themeMode === 'dark' ? '#1f2937' : '#ffffff',
      '--wcm-accent-color': '#3b82f6',
      '--wcm-accent-fill-color': '#ffffff',
    },
  };
}
