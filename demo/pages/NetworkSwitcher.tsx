import { useWalletConnectNetwork } from '@maximedogawa/chia-wallet-connect-react';

/**
 * Example Network Switcher Component
 * 
 * This component demonstrates how to use the useWalletConnectNetwork hook
 * to switch between mainnet and testnet at runtime.
 */
interface NetworkSwitcherProps {
  compact?: boolean;
}

export default function NetworkSwitcher({ compact = false }: NetworkSwitcherProps) {
  const { network, setNetwork, chainId } = useWalletConnectNetwork();

  if (compact) {
    // Compact version for header
    return (
      <div className="flex flex-col gap-1">
        <div className="flex gap-2">
          <button
            onClick={() => setNetwork('mainnet')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              network === 'mainnet'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-zinc-600'
            }`}
          >
            Mainnet
          </button>
          <button
            onClick={() => setNetwork('testnet')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              network === 'testnet'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-zinc-600'
            }`}
          >
            Testnet
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Chain ID: <span className="font-mono">{chainId}</span>
        </p>
      </div>
    );
  }

  // Full version for content area
  return (
    <div className="flex flex-col gap-2 p-4 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Network Switcher Example
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Current Network: <span className="font-mono font-semibold">{network}</span>
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Chain ID: <span className="font-mono text-xs">{chainId}</span>
      </p>
      
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => setNetwork('mainnet')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            network === 'mainnet'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-zinc-600'
          }`}
        >
          Mainnet
        </button>
        <button
          onClick={() => setNetwork('testnet')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            network === 'testnet'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-zinc-600'
          }`}
        >
          Testnet
        </button>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> Changing the network will affect all new WalletConnect connections.
          Existing connections will continue to use the network they were established with.
        </p>
      </div>
    </div>
  );
}
