'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useWalletConnectionState,
  WalletConnect,
  selectVisibilityTick,
} from '@maximedogawa/chia-wallet-connect-react';
import type {
  RootState,
  WalletBalanceResult,
} from '@maximedogawa/chia-wallet-connect-react';

/**
 * Demo component: shows WalletConnect session status, wallet address from
 * connection state, and optional relay check.
 */
export default function ConnectionStatusCheck() {
  const { isConnected, walletConnectSession, isWalletConnect, address } =
    useWalletConnectionState();
  const pairingUri = useSelector(
    (state: RootState) => state.walletConnect.pairingUri,
  );

  const [relayCheck, setRelayCheck] = useState<{
    status: 'idle' | 'checking' | 'ok' | 'error';
    error?: string;
  }>({ status: 'idle' });

  const [balanceCheck, setBalanceCheck] = useState<{
    status: 'idle' | 'loading' | 'ok' | 'error';
    data?: WalletBalanceResult;
    error?: string;
  }>({ status: 'idle' });

  // Re-render when tab becomes visible so connection state updates after app switch
  useSelector(selectVisibilityTick);

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

  const runBalanceRequest = async () => {
    setBalanceCheck({ status: 'loading' });
    try {
      const wc = new WalletConnect();
      const result = await wc.getWalletBalance(1);
      if (result.ok) {
        setBalanceCheck({ status: 'ok', data: result.data });
      } else {
        setBalanceCheck({ status: 'error', error: result.error });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setBalanceCheck({ status: 'error', error: message });
    }
  };

  const sessionStatus = pairingUri
    ? 'Pairing… (use link in wallet)'
    : isWalletConnect && walletConnectSession
      ? 'Connected'
      : 'Not connected';

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
        {isWalletConnect && address && (
          <p className="text-sm text-gray-700 dark:text-gray-300 font-mono break-all mt-1">
            <span className="text-gray-600 dark:text-gray-400">Address: </span>
            {address}
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

      {isWalletConnect && walletConnectSession && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-zinc-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Request wallet balance to verify requests work (chip0002_getAssetBalance or chia_getWalletBalance):
          </p>
          <button
            type="button"
            onClick={runBalanceRequest}
            disabled={balanceCheck.status === 'loading'}
            className="px-3 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {balanceCheck.status === 'loading' ? 'Requesting…' : 'Get wallet balance'}
          </button>
          {balanceCheck.status === 'ok' && balanceCheck.data && (
            <div className="mt-2 p-2 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-800 dark:text-green-200 font-mono">
              <p>Wallet id: {balanceCheck.data.walletId}</p>
              <p>Confirmed: {balanceCheck.data.confirmedWalletBalance} mojos</p>
              <p>Spendable: {balanceCheck.data.spendableBalance} mojos</p>
              <p>Unconfirmed: {balanceCheck.data.unconfirmedWalletBalance} mojos</p>
              <p className="mt-1 text-xs">
                (1 XCH = 1e12 mojos → {(balanceCheck.data.spendableBalance / 1e12).toFixed(6)} XCH)
              </p>
            </div>
          )}
          {balanceCheck.status === 'error' && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {balanceCheck.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
