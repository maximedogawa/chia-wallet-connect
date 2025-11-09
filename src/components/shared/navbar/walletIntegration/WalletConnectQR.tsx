import { Transition } from '@headlessui/react';
import { QRCodeSVG } from 'qrcode.react';
// import { useState } from 'react';
import toast from 'react-hot-toast';

import CopyButton from '../../CopyButton';

import { setPairingUri } from '@/redux/walletConnectSlice';
import { useAppDispatch } from '@/hooks';
import { isMobile, isIOS } from '@/utils/deviceDetection';
interface WalletConnectQRProps {
  pairingUri: string | null;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

function WalletConnectQR({ pairingUri, isOpen, setIsOpen } : WalletConnectQRProps) {
  const dispatch = useAppDispatch();
  const isMobileDevice = isMobile();
  const isIOSDevice = isIOS();


  const handleCancel = () => {
    dispatch(setPairingUri(null));
    setIsOpen(false);
    toast.error('Connection cancelled');
  };

  return ( 
    <Transition
      show={Boolean(isOpen)}
      enter="transition-all duration-300 ease-out"
      enterFrom="max-h-[0] opacity-0"
      enterTo="max-h-[700px] opacity-100"
      leave="transition-all duration-300 ease-in"
      leaveFrom="max-h-[700px] opacity-100"
      leaveTo="max-h-[0] opacity-0"
    >
      <div className="flex flex-col justify-center gap-3 sm:gap-4 py-2">
        {/* Loading state */}
        {!pairingUri && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-[200px] h-[200px] rounded-lg bg-brandDark/10 dark:bg-brandLight/10 mx-auto animate-pulse flex items-center justify-center">
              <div className="text-sm text-brandDark/50 dark:text-brandLight/50">Generating QR code...</div>
            </div>
            <p className="text-sm text-brandDark/70 dark:text-brandLight/70 text-center">
              Please wait while we prepare your connection...
            </p>
          </div>
        )}
        
        {/* QR Code and URI */}
        {pairingUri && (
          <>
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <div className="bg-white dark:bg-zinc-800 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl shadow-2xl ring-2 sm:ring-4 ring-brandDark/5 dark:ring-brandLight/5 transition-all duration-300">
                <QRCodeSVG
                  className="animate-fadeIn"
                  value={pairingUri}
                  includeMargin
                  size={isMobileDevice ? 180 : 250}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                  level="M"
                />
              </div>
              
              <div className="w-full flex flex-col gap-2">
                <p className="text-sm font-medium text-brandDark dark:text-brandLight text-center">
                  {isMobileDevice 
                    ? 'Scan this QR code with your wallet app' 
                    : 'Scan this QR code with your mobile wallet'}
                </p>
                
                {/* URI Textarea - Better UX for iOS */}
                <div className="relative">
                  <textarea
                    readOnly
                    value={pairingUri}
                    className="w-full p-3 text-xs font-mono bg-brandDark/10 dark:bg-brandLight/10 border-2 border-brandDark/20 dark:border-brandLight/20 rounded-lg text-brandDark dark:text-brandLight resize-none focus:outline-none focus:ring-2 focus:ring-brandDark/20 dark:focus:ring-brandLight/20 transition-all duration-300"
                    rows={isIOSDevice ? 6 : 4}
                    onClick={(e) => {
                      e.currentTarget.select();
                      e.currentTarget.setSelectionRange(0, pairingUri.length);
                    }}
                    onFocus={(e) => {
                      e.currentTarget.select();
                      e.currentTarget.setSelectionRange(0, pairingUri.length);
                    }}
                    placeholder="WalletConnect URI will appear here..."
                  />
                  {isIOSDevice && (
                    <p className="text-xs text-brandDark/60 dark:text-brandLight/60 mt-1 text-center">
                      Tap and hold the text above, then select &quot;Copy&quot;
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-2 w-full">
              <CopyButton 
                 disabled={!pairingUri}
                copyText={pairingUri ? pairingUri : ''} 
                height="40px"
                variant={isMobileDevice ? undefined : undefined}
              >
                Copy URI
              </CopyButton>
              
              <button 
                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium py-2 px-4 rounded-lg transition-all duration-300 hover:scale-[1.02] text-sm" 
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </Transition> 
  );
}

export default WalletConnectQR;