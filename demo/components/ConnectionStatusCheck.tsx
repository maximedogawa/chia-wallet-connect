'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useWalletConnectionState,
  WalletConnect,
} from '@maximedogawa/chia-wallet-connect-react';
import type { RootState } from '@maximedogawa/chia-wallet-connect-react';

/**
 * Demo component: shows WalletConnect session status, relay check, and a
 * wallet query (getAddress) to confirm the full request/response flow works.
 */
export default function ConnectionStatusCheck() {
  const { isConnected, walletConnectSession, isWalletConnect } =
    useWalletConnectionState();
  const pairingUri = useSelector(
    (state: RootState) => state.walletConnect.pairingUri,
  );

  const [relayCheck, setRelayCheck] = useState<{
    status: 'idle' | 'checking' | 'ok' | 'error';
    error?: string;
  }>({ status: 'idle' });

  const [validateConnection, setValidateConnection] = useState<{
    status: 'idle' | 'loading' | 'ok' | 'error';
    error?: string;
  }>({ status: 'idle' });

  const [walletQuery, setWalletQuery] = useState<{
    status: 'idle' | 'loading' | 'ok' | 'error';
    message?: string;
    error?: string;
  }>({ status: 'idle' });

  const runValidateConnection = async () => {
    setValidateConnection({ status: 'loading' });
    try {
      const wc = new WalletConnect();
      const ok = await wc.verifyConnectionWithChip0002ChainId();
      setValidateConnection(ok ? { status: 'ok' } : { status: 'error', error: 'Validation failed' });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setValidateConnection({ status: 'error', error: message });
    }
  };

  const runRelayCheck = async () => {
    setRelayCheck({ status: 'checking' });
    try {
      const wc = new WalletConnect();
      await wc.signClient();
      setRelayCheck({ status: 'ok' });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setRelayCheck({ status: 'error', error: message });
    }
  };

  const runWalletQuery = async () => {
    setWalletQuery({ status: 'loading' });
    try {
      const wc = new WalletConnect();
      const address = await wc.getAddress();
      if (address) {
        setWalletQuery({
          status: 'ok',
          message: `Wallet responded: ${address}`,
        });
      } else {
        setWalletQuery({
          status: 'error',
          error: 'Wallet returned no address',
        });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setWalletQuery({ status: 'error', error: message });
    }
  };

  const sessionStatus = pairingUri
    ? 'Pairing… (use link in wallet)'
    : isWalletConnect && walletConnectSession
      ? 'Connected'
      : 'Not connected';

  const canQueryWallet = Boolean(isWalletConnect && walletConnectSession);

  return (
    <div className="flex flex-col gap-2 p-4 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Wallet connection status
      </h3>

      <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-2 mb-2">
        <p className="text-xs text-amber-800 dark:text-amber-200">
          <strong>During pairing:</strong> Keep this tab in the foreground so the
          WebSocket stays open. If the connection is lost, use the new link shown
          after retry.
        </p>
      </div>
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 dark:text-gray-400">
            Session:
          </span>
          <span
            className={`font-medium ${
              isConnected
                ? 'text-green-600 dark:text-green-400'
                : pairingUri
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            {sessionStatus}
          </span>
        </div>
        {walletConnectSession && (
          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
            Topic: {walletConnectSession.topic}
          </p>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-zinc-700">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Check if the WalletConnect relay is reachable (e.g. after app switch on
          mobile):
        </p>
        <button
          type="button"
          onClick={runRelayCheck}
          disabled={relayCheck.status === 'checking'}
          className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {relayCheck.status === 'checking'
            ? 'Checking…'
            : 'Check relay connection'}
        </button>
        {relayCheck.status === 'ok' && (
          <p className="mt-2 text-sm text-green-600 dark:text-green-400">
            Relay OK — connection request should work.
          </p>
        )}
        {relayCheck.status === 'error' && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            Relay unavailable: {relayCheck.error}
          </p>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-zinc-700">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Validate connection using Sage method CHIP0002_CHAIN_ID:
        </p>
        <button
          type="button"
          onClick={runValidateConnection}
          disabled={!canQueryWallet || validateConnection.status === 'loading'}
          className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mr-2"
        >
          {validateConnection.status === 'loading'
            ? 'Validating…'
            : 'Validate (CHIP0002_CHAIN_ID)'}
        </button>
        {validateConnection.status === 'ok' && (
          <p className="mt-2 text-sm text-green-600 dark:text-green-400">
            Connection validated.
          </p>
        )}
        {validateConnection.status === 'error' && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {validateConnection.error}
          </p>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-zinc-700">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Query wallet (getAddress: chia_getCurrentAddress with chia_getAddress fallback for Sage):
        </p>
        <button
          type="button"
          onClick={runWalletQuery}
          disabled={!canQueryWallet || walletQuery.status === 'loading'}
          className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {walletQuery.status === 'loading'
            ? 'Querying…'
            : 'Query wallet (getAddress)'}
        </button>
        {!canQueryWallet && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Connect a wallet first to run a query.
          </p>
        )}
        {walletQuery.status === 'ok' && walletQuery.message && (
          <p className="mt-2 text-sm text-green-600 dark:text-green-400 break-all font-mono">
            {walletQuery.message}
          </p>
        )}
        {walletQuery.status === 'error' && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400 break-all">
            {walletQuery.error}
          </p>
        )}
      </div>
    </div>
  );
}
