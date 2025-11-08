import type { SessionTypes } from "@walletconnect/types";
import { Transition } from '@headlessui/react';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import toast from "react-hot-toast";

import PlusIcon from '../../icons/PlusIcon';
import WalletConnectIcon from '../../icons/WalletConnectIcon';
import Modal from '../../Modal';

import WalletConnectSession from './WalletConnectSession';
import CustomWalletConnectModal from './CustomWalletConnectModal';

import { type RootState } from '@/redux/store';
import store from '@/redux/store';
import WalletManager from "@/utils/walletIntegration/walletManager";
import WalletConnect from "@/utils/walletIntegration/wallets/walletConnect";
import { createLogger } from '@/utils/logger';
import { type WalletConnectMetadata } from '@/constants/wallet-connect';
import { isIOS } from '@/utils/deviceDetection';
import { useAppDispatch } from '@/hooks';
import { setPairingUri } from '@/redux/walletConnectSlice';

const logger = createLogger('ConnectWalletModal');




interface ConnectWalletModalProps {
    isOpen: boolean;
    setIsOpen: (value: boolean) => void;
    walletConnectIcon?: string; // Optional WalletConnect icon/image URL
    walletConnectMetadata?: WalletConnectMetadata; // Optional WalletConnect metadata configuration
}

function ConnectWalletModal({ isOpen, setIsOpen, walletConnectIcon, walletConnectMetadata }: ConnectWalletModalProps) {
    const dispatch = useAppDispatch();
    const connectedWallet = useSelector((state: RootState) => state.wallet.connectedWallet);
    const walletConnectSessions = useSelector((state: RootState) => state.walletConnect.sessions);
    const walletConnectSelectedSession = useSelector((state: RootState) => state.walletConnect.selectedSession);
    const pairingUri = useSelector((state: RootState) => state.walletConnect.pairingUri);
    const [isPairingQRModalOpen, setIsPairingQRModalOpen] = useState(false);
    
    const walletManager = new WalletManager(walletConnectIcon, walletConnectMetadata);
    const walletConnectActive = connectedWallet === "WalletConnect" && walletConnectSelectedSession;
    const isIOSDevice = isIOS();

    // Hydrate UI with WC sessions
    useEffect(() => {
        const walletConnect = new WalletConnect(walletConnectIcon, walletConnectMetadata);
        walletConnect.updateSessions();
    }, [walletConnectIcon, walletConnectMetadata])

    // Close pairing modal when pairingUri is cleared (connection successful)
    useEffect(() => {
        if (!pairingUri && isPairingQRModalOpen) {
            setIsPairingQRModalOpen(false);
        }
    }, [pairingUri, isPairingQRModalOpen])

    const connectWCSession = async () => {
        try {
            // Show pairing modal immediately for better UX
            setIsPairingQRModalOpen(true);
            
            const walletConnect = new WalletConnect(walletConnectIcon, walletConnectMetadata);
            const newSession = await walletConnect.connectSession();
            if (newSession) {
                logger.info("WC pairing successful!");
                // Address is already fetched in connectSession, so we can close the modal
                setIsPairingQRModalOpen(false);
                // Verify address was fetched
                const state = store.getState();
                const address = state.wallet.address;
                if (address) {
                    logger.info("WalletConnect connected with address:", address);
                    toast.success("WalletConnect connected successfully!");
                } else {
                    logger.warn("WalletConnect connected but address not available");
                }
            }
          } catch (error: any) {
            logger.error("WalletConnect connection error:", error);
            setIsPairingQRModalOpen(false); // Close modal on error
            if (error.message) {
              toast.error(`WalletConnect - ${error.message}`);
            } else {
              toast.error("Failed to connect WalletConnect");
            }
          }
    }

    return (
        <>
            {/* Native WalletConnect modal for: Desktop, Mac, Android, Windows, Linux */}
            {/* Custom glassmorphism modal only for iOS (better clipboard support) */}
            {isIOSDevice && isPairingQRModalOpen && (
                <CustomWalletConnectModal
                    isOpen={isPairingQRModalOpen}
                    onClose={() => {
                        setIsPairingQRModalOpen(false);
                        dispatch(setPairingUri(null));
                    }}
                />
            )}

            <Modal isOpen={isOpen} setIsOpen={setIsOpen} title="">
                {/* Wallet Options */}
                <div className="flex flex-col gap-4">

                {/* Wallet Connect */}
                <div>
                    <div 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (walletConnectSessions.length) {
                                walletManager.connect("WalletConnect");
                            } else {
                                connectWCSession();
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                if (walletConnectSessions.length) {
                                    walletManager.connect("WalletConnect");
                                } else {
                                    connectWCSession();
                                }
                            }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label="Connect WalletConnect" 
                        className={`
                            ${walletConnectActive 
                                ? 'bg-green-700/20 focus:ring-green-700/20' 
                                : 'bg-brandDark/10'
                            } 
                            ${walletConnectActive || (pairingUri && isPairingQRModalOpen) || isPairingQRModalOpen 
                                ? 'rounded-t-xl' 
                                : 'rounded-xl'
                            } 
                            hover:opacity-80 
                            group flex items-center justify-between 
                            border-2 border-transparent hover:border-brandDark/10 
                            py-4 px-4 
                            cursor-pointer 
                            transition-all
                        `}
                    >
                        <div className="flex items-center gap-4">
                            <WalletConnectIcon 
                                className="w-10 h-10 dark:fill-brandLight" 
                                icon={walletConnectIcon}
                            />
                        </div>
                        <button className={`
                            ${walletConnectActive ? 'outline-none text-green-700' : ''}
                            font-medium rounded-lg px-2 py-1
                            ${walletConnectActive ? "before:content-['Connected']" : "before:content-['Connect']"}
                            ${isPairingQRModalOpen ? "before:content-['Pairing'] animate-pulse" : ""}
                        `}
                        ></button>
                    </div>

                    <Transition
                        show={Boolean(walletConnectActive) || Boolean(pairingUri && isPairingQRModalOpen) || Boolean(isPairingQRModalOpen)}
                        enter="transition-all duration-300"
                        enterFrom="max-h-[0] opacity-0"
                        enterTo="max-h-[1000px] opacity-100"
                        leave="transition-all duration-300"
                        leaveFrom="max-h-[1000px] opacity-100"
                        leaveTo="max-h-[0] opacity-0"
                    >
                        <div className="animate-fadeIn text-sm bg-brandDark/10 font-medium px-4 py-4 rounded-b-xl flex flex-col gap-2 border-2 border-transparent hover:border-brandDark/10">
                            <p className={`text-base transition-opacity ${isPairingQRModalOpen || (!isPairingQRModalOpen && !walletConnectSessions.length) ? 'opacity-0' : ''}`}></p>
                            {/* Session list - shown when not pairing */}
                            {!pairingUri && !isPairingQRModalOpen && (
                                <ul className="flex flex-col gap-2">
                                {
                                    walletConnectSessions.map((session: SessionTypes.Struct) => (
                                        <WalletConnectSession key={session.topic} img={session.peer.metadata.icons[0]} name={session.peer.metadata.name} topic={session.topic} />
                                    ))
                                }

                                    <li onClick={() => (connectWCSession(), setIsPairingQRModalOpen(true))} className={`select-none rounded-xl px-8 py-4 cursor-pointer hover:opacity-80 flex justify-center items-center w-full bg-brandDark/10 h-10 animate-fadeIn`}>
                                        <PlusIcon className='w-6 h-auto' />
                                    </li>
                            
                                </ul>
                            )}
                        </div>
                    </Transition>
                </div>
            </div>
        </Modal>
        </>
     );
}

export default ConnectWalletModal;

