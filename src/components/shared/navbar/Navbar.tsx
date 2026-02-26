import React from 'react';

import ConnectButton from './walletIntegration/ConnectButton';

interface NavbarProps {
  theme: "dark" | "light" | "auto";
  setTheme: (theme: NavbarProps['theme']) => void;
}

export default function Navbar({ theme, setTheme }: NavbarProps) {
  return (
    <>
      <header className="sticky w-full top-0 bg-brandLight/50 dark:bg-zinc-900/50 backdrop-blur-xl z-20 md:h-24">
        <div className="container mx-auto px-4 flex gap-4 sm:gap-8 items-center justify-end py-2 h-full">
          <ConnectButton />
        </div>
      </header>
    </>
  );
};