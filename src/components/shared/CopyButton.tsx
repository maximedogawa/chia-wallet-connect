import { useState, useRef, useEffect, ReactNode } from 'react';

import { isIOS } from '@/utils/deviceDetection';
import { createLogger } from '@/utils/logger';

const logger = createLogger('CopyButton');

interface CopyButtonProps {
  copyText: string;
  height?: string;
  disabled?: boolean;
  children: ReactNode;
  variant?: "invisible"
}

const CopyButton = ({ copyText, height, disabled=false, variant, children }: CopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ensures when button text changes to reflect copied text, the size doesn't change
  useEffect(() => {
    if (buttonRef.current) {
        const buttonWidth = buttonRef.current.offsetWidth;
        buttonRef.current.style.minWidth = `${buttonWidth}px`;
    }
  },[]);

  // iOS fallback: Create a temporary textarea element for copying
  const copyToClipboardIOS = (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Create a temporary textarea element
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      textarea.style.top = '-999999px';
      textarea.setAttribute('readonly', '');
      document.body.appendChild(textarea);
      
      // Select and copy
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (successful) {
          resolve();
        } else {
          reject(new Error('execCommand copy failed'));
        }
      } catch (error) {
        document.body.removeChild(textarea);
        reject(error);
      }
    });
  };

  const handleCopy = async () => {
    if (isCopied || !copyText) return;
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(copyText);
      } else if (isIOS()) {
        // iOS fallback using execCommand
        await copyToClipboardIOS(copyText);
      } else {
        // Fallback for older browsers
        await copyToClipboardIOS(copyText);
      }
      
      setIsCopied(true);
      logger.debug('Text copied to clipboard successfully');

      setTimeout(() => {
        setIsCopied(false);
      }, 2000); // Show "Copied" for 2 seconds
    } catch (error) {
      logger.error('Copy failed:', error);
      
      // Fallback: Show the text in an alert or prompt for manual copying
      if (isIOS()) {
        // On iOS, try to select the text in a visible textarea
        if (textareaRef.current) {
          textareaRef.current.select();
          textareaRef.current.setSelectionRange(0, copyText.length);
          // Show a message that user needs to manually copy
          alert('Please tap and hold, then select "Copy" from the menu');
        } else {
          alert(`Please copy this manually:\n\n${copyText}`);
        }
      } else {
        alert(`Failed to copy. Please copy manually:\n\n${copyText}`);
      }
    }
  };

  const buttonStyle = (() => {
    // Native WalletConnect style for modal context
    const isModalContext = variant !== "invisible";
    
    // Default button style
    let style = isModalContext 
      ? "bg-blue-600 hover:bg-blue-700 text-white text-center font-medium py-1 flex items-center justify-center gap-2 px-4 whitespace-nowrap rounded-xl transition-colors"
      : "bg-brandDark/10 text-center font-medium py-1 flex items-center justify-center gap-2 px-4 whitespace-nowrap rounded-lg";
    let disabledStyle = disabled ? 'opacity-50 hover:opacity-50 cursor-not-allowed' : 'cursor-pointer';
    let copiedStyle = isCopied 
      ? isModalContext
        ? 'cursor-default bg-green-600 hover:bg-green-600 text-white'
        : 'cursor-default bg-green-700/20 text-green-700'
      : isModalContext
        ? 'text-white'
        : 'text-brandDark dark:text-brandLight';

    // Invisible button style
    if (variant === "invisible") {
      style = "rounded-lg";
      copiedStyle = isCopied ? 'cursor-default bg-green-700/20 font-medium text-green-700 px-4' : '';
      disabledStyle = disabled ? 'opacity-20 hover:opacity-20 cursor-not-allowed animate-pulse' : 'hover:opacity-80 cursor-pointer';
    }

    return `${disabledStyle} ${copiedStyle} ${style}`
  })()

  return (
    <>
      {/* Hidden textarea for iOS fallback */}
      {isIOS() && (
        <textarea
          ref={textareaRef}
          value={copyText}
          readOnly
          style={{
            position: 'absolute',
            left: '-9999px',
            opacity: 0,
            pointerEvents: 'none',
          }}
          aria-hidden="true"
          tabIndex={-1}
        />
      )}
      <button disabled={disabled} style={{ height: height }} onClick={handleCopy} ref={buttonRef} className={buttonStyle}>
        {!isCopied && variant !== "invisible" && <svg className="w-3.5 stroke-[54px] fill-brandDark aspect-square" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect x="128" y="128" width="336" height="336" rx="57" ry="57" fill="none" stroke="currentColor" strokeLinejoin="round" /><path d="M383.5 128l.5-24a56.16 56.16 0 00-56-56H112a64.19 64.19 0 00-64 64v216a56.16 56.16 0 0056 56h24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        {isCopied ? 'Copied!' : children}
      </button>
    </>
  );
};

export default CopyButton;
