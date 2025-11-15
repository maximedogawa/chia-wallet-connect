import toast from 'react-hot-toast';

import { generateOffer, walletNamesType } from './walletIntegrationInterface';
import WalletConnect from './wallets/walletConnect';

import store, { RootState } from '@/state/store';
import { setConnectedWallet } from '@/state/walletSlice';
import { createLogger } from '@/utils/logger';
import { type WalletConnectMetadata } from '@/constants/wallet-connect';

const logger = createLogger('WalletManager');

class WalletManager {
  private walletConnectIcon?: string;
  private walletConnectMetadata?: WalletConnectMetadata;

  constructor(walletConnectIcon?: string, walletConnectMetadata?: WalletConnectMetadata) {
    this.walletConnectIcon = walletConnectIcon;
    this.walletConnectMetadata = walletConnectMetadata;
  }

  private getWalletClassFromString(wallet: walletNamesType["walletNames"]) {
    if (wallet !== "WalletConnect") {
      throw new Error(`${wallet} is not supported. Only WalletConnect is available.`);
    }
    return new WalletConnect(this.walletConnectIcon, this.walletConnectMetadata);
  }

  public async connect(wallet: walletNamesType["walletNames"]): Promise<void> {
    try {
      const walletClass = this.getWalletClassFromString(wallet);
      const response = await walletClass.connect();
      if (response) {
        logger.debug("Getting address...");
        const address = await this.getAddress(wallet);
        logger.debug("Address retrieved:", address);
        // Only set connected wallet if we got an address (for WalletConnect, this means a session is active)
        if (address || wallet !== "WalletConnect") {
          const image = this.getImage(wallet);
          const name = this.getName(wallet);
          const setConnectedWalletInfo = {
            wallet,
            address,
            image,
            name
          }
          store.dispatch(setConnectedWallet(setConnectedWalletInfo))
        } else {
          logger.debug("No address retrieved for WalletConnect, session may not be fully connected");
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.message) {
        toast.error(`Wallet - ${error.message}`);
      }
    }
  }

  public async disconnect(wallet: walletNamesType["walletNames"]): Promise<void> {
    const walletClass = this.getWalletClassFromString(wallet);
    const response = await walletClass.disconnect();
    const currentWallet = store.getState().wallet.connectedWallet;
    if (response && wallet === currentWallet) store.dispatch(setConnectedWallet(null));
  }

  public async generateOffer(requestAssets: generateOffer["requestAssets"], offerAssets: generateOffer["offerAssets"], fee: number | undefined): Promise<string | void> {
    const state = store.getState() as RootState;
    const connectedWallet = state.wallet.connectedWallet;
    if (!connectedWallet) throw Error('You must connect a wallet to add an asset');
    const walletClass = this.getWalletClassFromString(connectedWallet);
    const offer = await walletClass.generateOffer(requestAssets, offerAssets, fee);
    if (offer) {
      return offer;
    }
  }

  public async addAsset(assetId: string, symbol: string, logo: string, fullName: string): Promise<void | boolean> {
    const state = store.getState() as RootState;
    const connectedWallet = state.wallet.connectedWallet;
    if (!connectedWallet) throw Error('You must connect a wallet to add an asset');
    try {
      const walletClass = this.getWalletClassFromString(connectedWallet);
      await walletClass.addAsset(assetId, symbol, logo, fullName);
      return true;
    } catch (error: unknown) {
        logger.error('Error adding asset:', error);
    }
  }

  public async getAddress(wallet: walletNamesType["walletNames"]): Promise<string | null> {
    const walletClass = this.getWalletClassFromString(wallet);
    return await walletClass.getAddress();
  }

  public getImage(wallet: walletNamesType["walletNames"]): string | null {
    const walletClass = this.getWalletClassFromString(wallet);
    return walletClass.image;
  }

  public getName(wallet: walletNamesType["walletNames"]): string | null {
    const walletClass = this.getWalletClassFromString(wallet);
    return walletClass.name;
  }

  public async detectEvents(): Promise<void> {
    const wallet = store.getState().wallet.connectedWallet;
    if (wallet) {
      const walletClass = this.getWalletClassFromString(wallet);
      await walletClass.detectEvents();
    }

    // Always detect WC events if there are still active sessions
    const walletConnectSessions = store.getState().walletConnect.sessions;
    if (walletConnectSessions.length) {
      const WalletConnect = this.getWalletClassFromString("WalletConnect");
      await WalletConnect.detectEvents();
    }

    if (wallet === "WalletConnect" && !walletConnectSessions.length) {
      store.dispatch(setConnectedWallet(null))
    }

  }

}

export default WalletManager;
