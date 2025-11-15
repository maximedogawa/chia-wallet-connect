import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import CopyButton from '../../CopyButton';

import { type RootState } from '@/state/store';
import { setPairingUri } from '@/state/walletConnectSlice';
import { useAppDispatch } from '@/hooks';
import { isIOS } from '@/utils/deviceDetection';

interface CustomWalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Custom WalletConnect modal for iOS with glassmorphism style
 * Optimized for small screens with better mobile UX
 */
function CustomWalletConnectModal({ isOpen, onClose }: CustomWalletConnectModalProps) {
  const dispatch = useAppDispatch();
  const pairingUri = useSelector((state: RootState) => state.walletConnect.pairingUri);
  const isIOSDevice = isIOS();

  const handleClose = () => {
    dispatch(setPairingUri(null));
    onClose();
    toast.error('Connection cancelled');
  };


  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose} initialFocus={undefined}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          {/* Glassmorphism backdrop */}
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              {/* Glassmorphism panel */}
              <Dialog.Panel className="w-full max-w-[90vw] sm:max-w-md transform overflow-hidden rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl text-left align-middle transition-all">
                {/* Glassmorphism Header */}
                <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-4 sm:pb-6 text-center border-b border-white/20 dark:border-gray-700/30 bg-gradient-to-b from-white/40 to-transparent dark:from-gray-800/40">
                  <Dialog.Title
                    as="h3"
                    className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1"
                  >
                    Connect Wallet
                  </Dialog.Title>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Scan with your wallet
                  </p>
                </div>

                <div className="flex flex-col items-center px-4 sm:px-6 py-6 sm:py-8">
                  {/* Loading state */}
                  {!pairingUri && (
                    <div className="flex flex-col items-center gap-3 sm:gap-4 py-8 sm:py-12 w-full">
                      <div className="w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] rounded-2xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 animate-pulse flex items-center justify-center">
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          Generating QR code...
                        </div>
                      </div>
                      {/* Focusable element for FocusTrap - Cancel button */}
                      <button
                        type="button"
                        onClick={handleClose}
                        className="mt-4 w-full py-2.5 sm:py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-gray-800/40 rounded-xl transition-all backdrop-blur-sm border border-white/30 dark:border-gray-700/30"
                        tabIndex={0}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* QR Code - Glassmorphism Style */}
                  {pairingUri && (
                    <>
                      <div className="bg-white/90 dark:bg-white/90 backdrop-blur-sm p-3 sm:p-4 rounded-2xl mb-4 sm:mb-6 shadow-lg border border-white/50 dark:border-gray-200/20">
                        <QRCodeSVG
                          value={pairingUri}
                          includeMargin={false}
                          size={isIOSDevice ? 200 : 240}
                          bgColor="#FFFFFF"
                          fgColor="#000000"
                          level="M"
                        />
                      </div>

                      {/* URI Textarea - Glassmorphism Style */}
                      <div className="w-full flex flex-col gap-2 sm:gap-3 mb-4">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center">
                          Or copy the connection URI manually:
                        </p>
                        <textarea
                          readOnly
                          value={pairingUri}
                          className="w-full p-2.5 sm:p-3 text-xs font-mono bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/40 dark:border-gray-700/40 rounded-xl text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 transition-all"
                          rows={isIOSDevice ? 5 : 4}
                          onClick={(e) => {
                            e.currentTarget.select();
                            e.currentTarget.setSelectionRange(0, pairingUri.length);
                          }}
                          onFocus={(e) => {
                            e.currentTarget.select();
                            e.currentTarget.setSelectionRange(0, pairingUri.length);
                          }}
                        />
                        {isIOSDevice && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            Tap and hold the text above, then select &quot;Copy&quot;
                          </p>
                        )}
                      </div>

                      {/* Action Buttons - Glassmorphism Style */}
                      <div className="w-full flex flex-col gap-2 sm:gap-3">
                        <CopyButton
                          disabled={!pairingUri}
                          copyText={pairingUri ? pairingUri : ''}
                          height="44px"
                        >
                          Copy URI
                        </CopyButton>

                        <button
                          className="w-full py-2.5 sm:py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-gray-800/40 rounded-xl transition-all backdrop-blur-sm border border-white/30 dark:border-gray-700/30"
                          onClick={handleClose}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default CustomWalletConnectModal;

