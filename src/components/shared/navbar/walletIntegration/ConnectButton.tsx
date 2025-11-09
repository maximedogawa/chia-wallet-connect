import { useState } from 'react';
import { useSelector } from 'react-redux';
import useSWR from "swr";

import SafeImage from '../../SafeImage';

import ConnectWalletModal from './ConnectWalletModal';


import { getCNSNameApiCall } from '@/api';
import { selectSession } from '@/redux/walletConnectSlice';
import { setCNSName } from '@/redux/walletSlice';
import { RootState } from '@/redux/store';
import { useAppDispatch } from '@/hooks';
import { createLogger } from '@/utils/logger';
import { type WalletConnectMetadata } from '@/constants/wallet-connect';

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
    const displayWalletImage = (() => {
      if (walletName === "WalletConnect" && walletConnectSelectedSession) {
        return walletConnectSelectedSession.peer.metadata.icons[0];
      } else if (connectedWallet === "WalletConnect" && !walletConnectSelectedSession && walletConnectSessions.length) {
        dispatch(selectSession(walletConnectSessions[0].topic));
        return walletConnectSessions[0].peer.metadata.icons[0];
      } else {
        return walletImage;
      }
    })();

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

    const displayAddress = () => {
      if (address && process.env.NEXT_PUBLIC_XCH) {
        const short_address = `${address.slice(0, 7)}...${address.slice(-4)}`;
        return short_address ? short_address : connectText;
      }
      return connectText;
    };

    const isWalletConnectActuallyConnected = connectedWallet === "WalletConnect" ? Boolean(connectedWallet === "WalletConnect" && walletConnectSelectedSession) : true;

    const defaultClassName = "flex items-center gap-2 bg-brandDark/10 text-brandDark dark:text-brandLight px-6 py-1.5 font-medium rounded-xl animate-fadeIn hover:opacity-80";
    const buttonClassName = className ? `${defaultClassName} ${className}` : defaultClassName;

    return (
        <>
            <button onClick={() => setIsWalletModalOpen(true)} className={buttonClassName}>
                {(connectedWallet && displayWalletImage && isWalletConnectActuallyConnected) && <SafeImage src={displayWalletImage} width={20} height={20} alt={`${walletName} wallet logo`} className="rounded-full w-5 h-5" />}
                {!connectedWallet || !isWalletConnectActuallyConnected ? connectText : (CNSName || displayAddress())}
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
