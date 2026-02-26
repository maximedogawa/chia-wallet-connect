import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import useSWR from "swr";

import SafeImage from '../../SafeImage.js';

import ConnectWalletModal from './ConnectWalletModal.js';


import { getCNSNameApiCall } from '@/api.js';
import { selectSession } from '@/state/walletConnectSlice.js';
import { setCNSName } from '@/state/walletSlice.js';
import { RootState } from '@/state/store.js';
import { useAppDispatch } from '@/hooks.js';
import { createLogger } from '@/utils/logger.js';
import { type WalletConnectMetadata } from '@/constants/wallet-connect.js';

const logger = createLogger('ConnectButton');

export type { WalletConnectMetadata };

export interface ConnectButtonProps {
  /**
   * Text to display when wallet is not connected
   * @default "Manage Wallet"
   */
  connectText?: string;
  /**
   * Custom className for the button
   */
  className?: string;
  /**
   * WalletConnect icon/image URL (overrides environment variable)
   */
  walletConnectIcon?: string;
  /**
   * WalletConnect metadata configuration (name, description, url, icons)
   * Icons default to WalletConnect icon if not provided
   */
  walletConnectMetadata?: WalletConnectMetadata;
}

function ConnectButton({ connectText = "Manage Wallet", className = "", walletConnectIcon, walletConnectMetadata }: ConnectButtonProps) {

    const dispatch = useAppDispatch();

    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)

    const connectedWallet = useSelector((state: RootState) => state.wallet.connectedWallet);
    const address = useSelector((state: RootState) => state.wallet.address);
    const walletImage = useSelector((state: RootState) => state.wallet.image);
    const walletName = useSelector((state: RootState) => state.wallet.name);
    const CNSName = useSelector((state: RootState) => state.wallet.CNSName);
    const walletConnectSelectedSession = useSelector((state: RootState) => state.walletConnect.selectedSession);
    const walletConnectSessions = useSelector((state: RootState) => state.walletConnect.sessions);
    
    // Ensure selectedSession is set if we have sessions but no selected session
    useEffect(() => {
      if (connectedWallet === "WalletConnect" && !walletConnectSelectedSession && walletConnectSessions.length > 0) {
        dispatch(selectSession(walletConnectSessions[0].topic));
      }
    }, [connectedWallet, walletConnectSelectedSession, walletConnectSessions, dispatch]);
    
    // Compute display wallet image reactively using useMemo to ensure it updates when dependencies change
    const displayWalletImage = useMemo(() => {
      if (walletName === "WalletConnect" && walletConnectSelectedSession) {
        return walletConnectSelectedSession.peer.metadata.icons[0];
      } else if (connectedWallet === "WalletConnect" && walletConnectSessions.length > 0) {
        // If we have sessions but no selected session yet, use the first one's icon
        // (the useEffect above will set it, but we can show the icon immediately)
        return walletConnectSessions[0].peer.metadata.icons[0];
      } else {
        return walletImage;
      }
    }, [walletName, walletConnectSelectedSession, connectedWallet, walletConnectSessions, walletImage]);

    // CNSName is only ever null if it hasn't ever been fetched (if no name fetched, it's an empty string)
    // If CNSName hasn't previously been fetched set it in Redux
    const shouldFetch = CNSName === null;
    useSWR(shouldFetch && address, () => getCNSNameApiCall(address || ''),
     {
      onSuccess(data) {
        dispatch(setCNSName(data));
      },
      onError: (error) => {
        logger.error("CNS POST query failed", error);
      }
     }
    );

    // Compute display address reactively
    const displayAddress = useMemo(() => {
      if (address && process.env.NEXT_PUBLIC_XCH) {
        const short_address = `${address.slice(0, 7)}...${address.slice(-4)}`;
        return short_address ? short_address : connectText;
      }
      return connectText;
    }, [address, connectText]);

    // For WalletConnect, we need both connectedWallet and selectedSession to be truthy
    // For other wallets, just check connectedWallet
    const isWalletConnectActuallyConnected = useMemo(() => {
      return connectedWallet === "WalletConnect" 
        ? Boolean(walletConnectSelectedSession) 
        : Boolean(connectedWallet);
    }, [connectedWallet, walletConnectSelectedSession]);

    const defaultClassName = "flex items-center gap-2 bg-brandDark/10 text-brandDark dark:text-brandLight px-6 py-1.5 font-medium rounded-xl animate-fadeIn hover:opacity-80";
    const buttonClassName = className ? `${defaultClassName} ${className}` : defaultClassName;

    return (
        <>
            <button onClick={() => setIsWalletModalOpen(true)} className={buttonClassName}>
                {(connectedWallet && displayWalletImage && isWalletConnectActuallyConnected) && <SafeImage src={displayWalletImage} width={20} height={20} alt={`${walletName} wallet logo`} className="rounded-full w-5 h-5" />}
                {!connectedWallet || !isWalletConnectActuallyConnected ? connectText : (CNSName || displayAddress)}
            </button>
            <ConnectWalletModal
              isOpen={isWalletModalOpen}
              setIsOpen={setIsWalletModalOpen}
              walletConnectIcon={walletConnectIcon}
              walletConnectMetadata={walletConnectMetadata}
            />
        </>
     );
}

export default ConnectButton;
