import Image from 'next/image';

import { WALLET_CONNECT_ICON } from '@/constants/wallet-connect';

type WalletConnectIconProps = {
  className?: string;
  icon?: string; // Optional icon URL to override default
}

function WalletConnectIcon({ className, icon }: WalletConnectIconProps) {
  // If icon prop is provided, use it; otherwise use the default from env or constant
  const iconUrl = icon || WALLET_CONNECT_ICON;
  
  // Always use Image component to load the icon (local file, external URL, or custom)
  // The default is now a local SVG file at /assets/walletconnect.svg
  return (
    <Image
      src={iconUrl}
      alt="WalletConnect"
      width={40}
      height={40}
      className={className || "w-10 h-10"}
    />
  );
}

export default WalletConnectIcon;