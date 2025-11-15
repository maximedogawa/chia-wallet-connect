// Note: Styles must be imported separately by consumers
// import '@maximedogawa/chia-wallet-connect-react/styles';

export { default as ConnectButton } from './components/shared/navbar/walletIntegration/ConnectButton';
export type { ConnectButtonProps } from './components/shared/navbar/walletIntegration/ConnectButton';
export { default as ConnectWalletModal } from './components/shared/navbar/walletIntegration/ConnectWalletModal';
export { default as WalletConnectQR } from './components/shared/navbar/walletIntegration/WalletConnectQR';
export { default as WalletConnectSession } from './components/shared/navbar/walletIntegration/WalletConnectSession';
export { default as AddAssetButton } from './components/shared/navbar/walletIntegration/AddAssetButton';
export { default as FingerprintListbox } from './components/shared/navbar/walletIntegration/FingerprintListbox';

// Core utilities
export { default as WalletManager } from './utils/walletIntegration/walletManager';
export { default as WalletConnect } from './utils/walletIntegration/wallets/walletConnect';
export type { default as WalletIntegrationInterface, walletNamesType, generateOffer } from './utils/walletIntegration/walletIntegrationInterface';

// Redux store and hooks
export { default as store, persistor } from './state/store';
export type { RootState, AppDispatch } from './state/store';
export { useAppDispatch, useAppSelector } from './hooks';

// Connection state hooks
export { useWalletConnectionState } from './hooks/useWalletConnectionState';
export { useWalletConnectRestore, restoreConnectionStateImmediate } from './hooks/useWalletConnectRestore';

// Connection state restoration utility
export { restoreConnectionState } from './utils/walletIntegration/restoreConnectionState';
export type { RestoreConnectionStateOptions } from './utils/walletIntegration/restoreConnectionState';

// Redux slices and actions
export { setConnectedWallet, setAddress, setCNSName } from './state/walletSlice';
export {
  connectSession,
  setPairingUri,
  selectSession,
  setSessions,
  deleteTopicFromFingerprintMemory,
  setSelectedFingerprint
} from './state/walletConnectSlice';
export {
  setUserMustAddTheseAssetsToWallet,
  setOfferRejected,
  setRequestStep
} from './state/completeWithWalletSlice';

// Types
export type { SessionTypes } from '@walletconnect/types';

// Shared components (if needed)
export { default as Modal } from './components/shared/Modal';
export { default as CopyButton } from './components/shared/CopyButton';
export { default as SafeImage } from './components/shared/SafeImage';
