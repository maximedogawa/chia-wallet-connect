import { SageMethods } from './sage-methods'

// Chain IDs
export const CHIA_MAINNET_CHAIN_ID = 'chia:mainnet'
export const CHIA_TESTNET_CHAIN_ID = 'chia:testnet'

// Storage key
export const WALLET_CONNECT_STORAGE_KEY = 'walletconnect'

// Get chain ID based on environment
const getChainId = (): string => {
  const network = process.env.NEXT_PUBLIC_CHIA_NETWORK || process.env.CHIA_NETWORK || 'mainnet'
  return network === 'testnet' ? CHIA_TESTNET_CHAIN_ID : CHIA_MAINNET_CHAIN_ID
}

export const CHIA_CHAIN_ID = getChainId()

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

// Required namespaces with Sage methods
export const REQUIRED_NAMESPACES = {
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
    chains: [CHIA_CHAIN_ID],
    events: ['chainChanged', 'accountsChanged'],
  },
}

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
export const getModalConfig = () => {
  const projectId = SIGN_CLIENT_CONFIG.projectId;
  if (!projectId) {
    return null;
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
    chains: [CHIA_CHAIN_ID],
    themeMode,
  };
};
