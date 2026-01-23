import { ConnectButton } from '@maximedogawa/chia-wallet-connect-react';
import NetworkSwitcher from '../pages/NetworkSwitcher';

/**
 * Sticky header with network switcher and wallet connect button
 */
export default function DemoNavbar() {
  return (
    <header className="sticky w-full top-0 bg-brandLight/50 dark:bg-zinc-900/50 backdrop-blur-xl z-20 border-b border-gray-200 dark:border-zinc-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Wallet Connect Demo
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Example implementation of Chia Wallet Connect
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <NetworkSwitcher compact />
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
