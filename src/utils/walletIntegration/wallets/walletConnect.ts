import type { SessionTypes } from "@walletconnect/types";
import SignClient from "@walletconnect/sign-client";
import Client from '@walletconnect/sign-client';
import { WalletConnectModal } from '@walletconnect/modal';
import { toast } from 'react-hot-toast';
import pino from 'pino';

import WalletIntegrationInterface, { generateOffer } from '../walletIntegrationInterface.js';

import store from '@/state/store.js';
import { setAddress, setConnectedWallet } from '@/state/walletSlice.js';
import { connectSession, setPairingUri, selectSession, setSessions, deleteTopicFromFingerprintMemory, setSelectedFingerprint } from '@/state/walletConnectSlice.js';
import { setUserMustAddTheseAssetsToWallet, setOfferRejected, setRequestStep } from '@/state/completeWithWalletSlice.js';
import { selectNetwork } from '@/state/walletConnectNetworkSlice.js';
import { getChainId, getRequiredNamespaces, SIGN_CLIENT_CONFIG, DEFAULT_WALLET_IMAGE, type WalletConnectMetadata, getModalConfig } from '@/constants/wallet-connect.js';
import { SageMethods } from '@/constants/sage-methods.js';
import { createLogger } from '@/utils/logger.js';
import { isIOS } from '@/utils/deviceDetection.js';

const logger = createLogger('WalletConnect');

// Singleton SignClient instance to prevent multiple initializations
let globalSignClient: SignClient | null = null;
let globalSignClientPromise: Promise<SignClient> | null = null;

// Singleton WalletConnectModal instance to prevent duplicate custom element registrations
let globalWalletConnectModal: WalletConnectModal | null = null;

// Singleton MutationObserver for theme changes to prevent multiple observers on the same element
let globalModalThemeObserver: MutationObserver | null = null;


interface wallet {
  data: string
  id: number
  name: string
  type: 6
  meta: {
    assetId: string
    name: string
  }
}

interface wallets {
  data: wallet[]
  isError: boolean
  isSuccess: boolean
}

interface WalletsResponse {
  wallets: wallets | null,
  isSage: boolean
}

// WalletConnect error type
interface WalletConnectError extends Error {
  code?: number;
  message: string;
}

// Asset type for offer/request
interface WalletConnectAsset {
  assetId: string;
  amount: number;
  hiddenPuzzleHash?: string;
}

// Type guard for WalletConnect errors
function isWalletConnectError(error: unknown): error is WalletConnectError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as WalletConnectError).message === 'string'
  );
}

class WalletConnectIntegration implements WalletIntegrationInterface {
  name = "WalletConnect"
  image: string
  topic
  client: SignClient | undefined
  selectedFingerprint
  session: SessionTypes.Struct | undefined
  metadata?: WalletConnectMetadata
  modal: WalletConnectModal | undefined // Native WalletConnect modal (desktop only)
  modalThemeObserver: MutationObserver | undefined // Observer for theme changes
  
  constructor(image?: string, metadata?: WalletConnectMetadata) {
    // Allow image to be passed as prop, otherwise use default from constants
    this.image = image || DEFAULT_WALLET_IMAGE;
    // Allow metadata to be passed as prop for custom configuration
    this.metadata = metadata;
    // Give methods access to current Redux state
    const state = store.getState();
    const selectedSession = state.walletConnect.selectedSession;
    if (selectedSession) {
      this.topic = selectedSession.topic;
      this.session = selectedSession;
      const fingerprint = state.walletConnect.selectedFingerprint[selectedSession.topic];
      this.selectedFingerprint = fingerprint;
    }
  }

  /**
   * Validates if a chain ID is a valid Chia chain ID.
   * 
   * @param chainId - The chain ID to validate
   * @returns True if the chain ID is valid, false otherwise
   */
  private isValidChainId(chainId: string | null | undefined): chainId is string {
    return chainId === 'chia:mainnet' || chainId === 'chia:testnet';
  }

  /**
   * Extracts chain ID from session's chains array.
   * 
   * @param session - The WalletConnect session
   * @returns The chain ID if found and valid, null otherwise
   */
  private extractChainIdFromSessionChains(session: SessionTypes.Struct): string | null {
    const chains = session.namespaces?.chia?.chains;
    if (!chains || chains.length === 0) {
      return null;
    }

    const sessionChainId = chains[0];
    if (this.isValidChainId(sessionChainId)) {
      logger.debug('Using chain ID from session chains:', sessionChainId);
      return sessionChainId;
    }

    logger.warn(`Invalid chain ID in session chains: ${sessionChainId}. Trying accounts...`);
    return null;
  }

  /**
   * Extracts chain ID from session's account format.
   * Account format: "chia:mainnet:123" or "chia:testnet:123"
   * 
   * @param session - The WalletConnect session
   * @returns The chain ID if found and valid, null otherwise
   */
  private extractChainIdFromSessionAccounts(session: SessionTypes.Struct): string | null {
    const accounts = session.namespaces?.chia?.accounts;
    if (!accounts || accounts.length === 0) {
      return null;
    }

    const firstAccount = accounts[0];
    const accountParts = firstAccount.split(':');
    
    if (accountParts.length < 2) {
      return null;
    }

    const potentialChainId = `${accountParts[0]}:${accountParts[1]}`;
    if (this.isValidChainId(potentialChainId)) {
      logger.debug('Using chain ID extracted from session account:', potentialChainId);
      return potentialChainId;
    }

    return null;
  }

  /**
   * Gets the chain ID from the current network setting in Redux.
   * 
   * @returns A valid chain ID (defaults to mainnet if invalid)
   */
  private getChainIdFromNetworkSetting(): string {
    const state = store.getState();
    const network = selectNetwork(state);
    const chainId = getChainId(network);
    
    logger.debug('Using chain ID from network setting:', chainId, 'for network:', network);
    
    if (!this.isValidChainId(chainId)) {
      logger.error(`Invalid chain ID: ${chainId}. Defaulting to mainnet.`);
      return getChainId('mainnet');
    }
    
    return chainId;
  }

  /**
   * Get the chain ID from the active session, or fall back to the current network setting.
   * Sessions are established with a specific chain ID, so we should use the session's chain ID
   * for requests to avoid "Missing or invalid chainId" errors.
   * 
   * @returns The chain ID from the session, or the current network setting if no session
   */
  getChainId(): string {
    const state = store.getState();
    const selectedSession = state.walletConnect.selectedSession;
    
    // If we have an active session, try to extract chain ID from it
    if (selectedSession?.namespaces?.chia) {
      // Try to get chain ID from session chains first
      const chainIdFromChains = this.extractChainIdFromSessionChains(selectedSession);
      if (chainIdFromChains) {
        return chainIdFromChains;
      }

      // Fallback: Extract chain ID from accounts
      const chainIdFromAccounts = this.extractChainIdFromSessionAccounts(selectedSession);
      if (chainIdFromAccounts) {
        return chainIdFromAccounts;
      }

      logger.warn('Could not extract chain ID from session, falling back to network setting');
    }
    
    // Fall back to current network setting if no session or couldn't extract chain ID
    return this.getChainIdFromNetworkSetting();
  }

  async updateSessions() {
    try {
      const sessions = await this.getAllSessions();
      if (sessions) {
        store.dispatch(setSessions(sessions));
      } else {
        store.dispatch(setSessions([]))
        store.dispatch(setAddress(null));
        if (store.getState().wallet.connectedWallet === "WalletConnect") store.dispatch(setConnectedWallet(null))
        logger.error('No WC sessions found');
      }
      } catch (error: unknown) {
        if (isWalletConnectError(error)) {
          logger.error(`WalletConnect - ${error.message}`);
        }
        throw error;
    }
  }

  async deleteTopicFromLocalStorage(topic: string) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('wc') && key.endsWith('//session')) {
          const responseList = await JSON.parse(localStorage.getItem(key)!);
          localStorage.setItem(key!, JSON.stringify(responseList.filter((item: { topic: string }) => item.topic !== topic)));
      }
    }   
  }

  // If the session being disconnected is the only session connected, then disconnect the wallet in the wallet slice
  async updateConnectedWalletOnDisconnect(topic?: string) {
    const state = store.getState();
    if (!state.walletConnect.sessions.length && "WalletConnect" === store.getState().wallet.connectedWallet) {
      store.dispatch(setConnectedWallet(null));
    }

    if (!topic) return
    // If user disconnects the currently selected session, select the next available one
    const sessions = state.walletConnect.sessions
    const selectedSession = state.walletConnect.selectedSession
    if (sessions.length && selectedSession && topic === selectedSession.topic) {
      const newSessionTopic = sessions[sessions.length-1].topic;
      store.dispatch(selectSession(newSessionTopic))
    }
  }

  async connect(): Promise<boolean> {
    // For WalletConnect, check if there are existing sessions
    // If there are sessions but no selected session, select the first one
    const state = store.getState();
    const sessions = state.walletConnect.sessions;
    const selectedSession = state.walletConnect.selectedSession;
    
    if (sessions.length > 0 && !selectedSession) {
      // Select the first available session
      const firstSession = sessions[0];
      store.dispatch(selectSession(firstSession.topic));
      
      // Ensure fingerprint is set for this session
      if (!state.walletConnect.selectedFingerprint[firstSession.topic]) {
        const defaultFingerprint = Number(firstSession.namespaces.chia.accounts[0].split(":")[2]);
        store.dispatch(setSelectedFingerprint({ topic: firstSession.topic, selectedFingerprint: defaultFingerprint }));
        logger.debug('connect: Set default fingerprint for session', { topic: firstSession.topic, fingerprint: defaultFingerprint });
      }
      
      logger.debug('connect: Selected first available session', { topic: firstSession.topic });
      return true;
    }
    
    // If there's already a selected session, ensure it has a fingerprint
    if (selectedSession) {
      if (!state.walletConnect.selectedFingerprint[selectedSession.topic]) {
        const defaultFingerprint = Number(selectedSession.namespaces.chia.accounts[0].split(":")[2]);
        store.dispatch(setSelectedFingerprint({ topic: selectedSession.topic, selectedFingerprint: defaultFingerprint }));
        logger.debug('connect: Set default fingerprint for existing session', { topic: selectedSession.topic, fingerprint: defaultFingerprint });
      }
      logger.debug('connect: Session already selected', { topic: selectedSession.topic });
      return true;
    }
    
    // No sessions available - user needs to call connectSession() first
    logger.debug('connect: No sessions available, connectSession() must be called first');
    return false;
  }

  async connectSession(): Promise<void | SessionTypes.Struct> {  
    // Initiate connection and pass pairing uri to the modal (QR code)
    try {
      const signClient = await this.signClient();
        if (signClient) {
          // Ensure modal is initialized before connecting (for desktop)
          // Use global singleton modal to prevent duplicate custom element registrations
          if (!isIOS() && typeof window !== 'undefined') {
            if (!globalWalletConnectModal) {
              const currentChainId = this.getChainId();
              const modalConfig = getModalConfig(currentChainId);
              if (modalConfig) {
                try {
                  globalWalletConnectModal = new WalletConnectModal(modalConfig);
                  logger.debug('Native WalletConnect modal initialized for desktop', { theme: modalConfig.themeMode });
                  // Set up theme observer on the global modal instance (only once)
                  if (!globalModalThemeObserver) {
                    this.setupThemeObserver();
                  }
                } catch (modalError) {
                  logger.error('Failed to initialize WalletConnect modal:', modalError);
                }
              }
            }
            // Always use the global modal instance (convert null to undefined for type compatibility)
            this.modal = globalWalletConnectModal ?? undefined;
          }
          
          // Use REQUIRED_NAMESPACES with current network setting (for NEW connections)
          // Note: requiredNamespaces is deprecated, using optionalNamespaces instead
          // Fetch uri to display QR code to establish new wallet connection
          // For new connections, we use the current network setting, not an existing session's chain ID
          let currentChainId: string;
          let requiredNamespaces;
          try {
            // Get chain ID from current network setting (not from existing session)
            const state = store.getState();
            const network = selectNetwork(state);
            currentChainId = getChainId(network);
            requiredNamespaces = getRequiredNamespaces(currentChainId);
            logger.debug('Connecting new session with chain ID:', currentChainId);
          } catch (error) {
            logger.error('Error getting chain ID or required namespaces:', error);
            throw new Error(`Failed to initialize WalletConnect connection: ${error instanceof Error ? error.message : String(error)}`);
          }
          
          const { uri, approval } = await signClient.connect({
            optionalNamespaces: requiredNamespaces,
          });

          // Use native WalletConnect modal on desktop, custom modal on iOS
          if (uri) {
            if (this.modal && !isIOS()) {
              // Use native WalletConnect modal for desktop
              this.modal.openModal({ uri });
              logger.debug('Opened native WalletConnect modal');
            } else {
              // Use custom modal for iOS or fallback
              store.dispatch(setPairingUri(uri));
            }
          }

          // If new connection established successfully
          const session = await approval();
          logger.info('Connected Chia wallet via WalletConnect', { session, signClient });
          
          // Close native modal if it was opened
          if (this.modal && !isIOS()) {
            this.modal.closeModal();
          }
          
          store.dispatch(setPairingUri(null));
          this.detectEvents()

          await this.updateSessions();
          store.dispatch(connectSession(session))
          
          // Update instance properties to match the new session
          this.topic = session.topic;
          this.session = session;
          this.selectedFingerprint = Number(session.namespaces.chia.accounts[0].split(":")[2]);
          
          // Verify connection using CHIA_GET_ADDRESS method (Sage method)
          let address: string | null = null;
          try {
            logger.debug('Verifying connection using CHIA_GET_ADDRESS method...');
            address = await this.verifyConnectionWithSageMethod();
            if (address) {
              logger.debug('Connection verified successfully!');
              logger.debug('Address retrieved:', address);
            } else {
              logger.debug('CHIA_GET_ADDRESS returned null, trying fallback method...');
              // Fallback to regular getAddress if Sage method doesn't work
              address = await this.getAddress();
              logger.debug('Fallback address fetch result:', address);
            }
          } catch (addressError) {
            logger.debug('CHIA_GET_ADDRESS verification failed, trying fallback:', addressError);
            // Try fallback method
            try {
              address = await this.getAddress();
              logger.debug('Fallback address fetch successful:', address);
            } catch (fallbackError) {
              logger.error('Failed to fetch address after connection:', fallbackError);
              // Continue even if address fetch fails - connection is still successful
            }
          }
          
          // Update main wallet slice to notify that it is now the active wallet
          // Use WalletConnect icon (this.image) instead of Sage Wallet icon
          const setConnectedWalletInfo = {
            wallet: "WalletConnect",
            address: address,
            image: this.image, // Use WalletConnect icon, not Sage Wallet icon
            name: "WalletConnect"
          }
          store.dispatch(setConnectedWallet(setConnectedWalletInfo))

          return session;
        }
    } catch (error) {
      logger.error('Error connecting WalletConnect session:', error);
      
      // Close native modal if it was opened
      if (this.modal && !isIOS()) {
        this.modal.closeModal();
      }
      
      // Clear pairing URI on error
      store.dispatch(setPairingUri(null));
      // Re-throw error so calling code can handle it
      throw error;
    }
  }

  disconnect() {
    return true;
  }

  async disconnectSession(topic: string) {
    // Sign client
    const signClient = await this.signClient();
    
    // Fetch previous connection
    try {
        if (!signClient) {
          toast.error('Not connected via WalletConnect or could not sign client', { id: 'failed-to-sign-client' })
          return;
        }
        
        // Send request to get Wallets via WalletConnect
        await signClient.disconnect({
          topic,
          reason: {
            code: 6000,
            message: "User disconnected."
          },
        });
        
        await this.deleteTopicFromLocalStorage(topic);

        await this.updateSessions();
        await this.updateConnectedWalletOnDisconnect();

        // Remove any saved fingerprint preference if any
        store.dispatch(deleteTopicFromFingerprintMemory(topic));

      } catch (error: unknown) {
        this.updateSessions();
        if (isWalletConnectError(error)) {
          logger.error('Error disconnecting session:', error.message);
        } else {
          logger.error('Error disconnecting session:', error);
        }
    }
  }

  async generateOffer(requestAssets: generateOffer["requestAssets"], offerAssets: generateOffer["offerAssets"], fee: number | undefined): Promise<string | void> {

    // Show modal to user taking them through each step of the process
    store.dispatch(setRequestStep("getWallets"));
    store.dispatch(setOfferRejected(false));
    // showCompleteWithWalletModal(this)

    let firstRun = true;
    let tempAssetsToAddArray: generateOffer["offerAssets"] = [];

    let walletsResponse;
    while (firstRun || tempAssetsToAddArray.length > 0) {
      firstRun = false
      tempAssetsToAddArray = []

      // Send request to fetch users wallets
      walletsResponse = await this.getWallets();
      if(!walletsResponse?.isSage) {
          const wallets = walletsResponse?.wallets;
          if (!wallets) {
            store.dispatch(setRequestStep(null))
            return;
          }

          // Match assetIds to users wallet to find the wallet ID (required to send a create offer)

          // For offering assets
          offerAssets.forEach(offerItem => {
            // If item is Chia, set walletId to 1 as this is the default
            if (offerItem.assetId === "") return offerItem.walletId = 1;

            const matchingChiaWallet = wallets!.data.find(item => item.meta.assetId === offerItem.assetId);
            if (matchingChiaWallet) {
              offerItem.walletId = matchingChiaWallet.id;
            } else {
              tempAssetsToAddArray.push({...offerItem})
            }
          })

          // For requesting assets
          requestAssets.forEach(requestItem => {
            // If item is Chia, set walletId to 1 as this is the default
            if (requestItem.assetId === "") return requestItem.walletId = 1;

            const matchingChiaWallet = wallets.data.find(item => item.meta.assetId == requestItem.assetId);
            if (matchingChiaWallet) {
              requestItem.walletId = matchingChiaWallet.id;
            } else {
              tempAssetsToAddArray.push({...requestItem})
            }
          })

          if (tempAssetsToAddArray.length) {
            store.dispatch(setUserMustAddTheseAssetsToWallet(tempAssetsToAddArray));
            store.dispatch(setRequestStep("addAssets"));


            // We now have a list of assets which need adding. We keep track of the list length. When it's 0, we can continue as all assets are added.
            const checkIfAssetsHaveBeenAdded = () => {
              return new Promise<void>((resolve, reject) => {
                const unsubscribe = store.subscribe(() => {
                  const state = store.getState();
                  const userMustAddTheseAssetsToWallet = state.completeWithWallet.userMustAddTheseAssetsToWallet;
                  if (userMustAddTheseAssetsToWallet.length === 0 && !state.completeWithWallet.offerRejected) {
                    unsubscribe();
                    store.dispatch(setRequestStep("getWalletsAgain"));
                    resolve();
                  } else if (state.completeWithWallet.offerRejected) {
                    unsubscribe();
                    reject();
                  }
                  // Still more assets to add, wait for next update & check again
                });
              });
            }

            await checkIfAssetsHaveBeenAdded();
          }      
          
        } // End of while loop (will run twice if user has had to add assets to continue)
      }
    
    store.dispatch(setRequestStep("generateOffer"));
    
    // Generate offer object
    const offer: {[key: number]: number} = {};
    offerAssets.forEach((asset) => {
      if (!asset.walletId) return;
      offer[asset.walletId] = -Math.abs(asset.amount);
    });

    // Generate request object
    const request: {[key: number]: number} = {};
    requestAssets.forEach((asset) => {
      if (!asset.walletId) return
      request[asset.walletId] = asset.amount;
    })

    // Create final object for WalletConnect request
    const compressedOffer = {...offer, ...request}


    // Sign client
    const signClient = await this.signClient();
    
    // Fetch previous connection
    try {
        if (!this.topic || !signClient) {
          toast.error('Not connected via WalletConnect or could not sign client', { id: 'failed-to-sign-client' })
          return;
        }

        interface resultOffer {
          error?: {
            data: {
              error: string
              success: boolean
            }
          }
          data?: {
            offer: string
            success: boolean
          }
        }

        if(walletsResponse?.isSage) {
          logger.info("Sage offer request");
         
          const currentChainId = this.getChainId();
          const resultOffer: {offer: string | undefined, error: string | undefined} = await signClient.request({
            topic: this.topic,
            chainId: currentChainId,
            request: {
              method: "chia_createOffer",
              params: {
                offerAssets: offerAssets.map(offerItem => {
                  const asset: WalletConnectAsset = {
                    assetId: offerItem.assetId,
                    amount: offerItem.amount
                  };
                  if (offerItem.hiddenPuzzleHash && offerItem.hiddenPuzzleHash.length == 64) {
                    asset.hiddenPuzzleHash = offerItem.hiddenPuzzleHash;
                  }
                  return asset;
                }),
                requestAssets: requestAssets.map(requestItem => {
                  const asset: WalletConnectAsset = {
                    assetId: requestItem.assetId,
                    amount: requestItem.amount
                  };
                  if (requestItem.hiddenPuzzleHash && requestItem.hiddenPuzzleHash.length == 64) {
                    asset.hiddenPuzzleHash = requestItem.hiddenPuzzleHash;
                  }
                  return asset;
                }),
                fee
              },
            },
          })

          if (resultOffer.error) {
            toast.error(resultOffer.error);
            // Set offer rejected: true
            store.dispatch(setOfferRejected(true));
          } else if (resultOffer.offer) {
            store.dispatch(setRequestStep(null));
            return resultOffer.offer;
          }
        }

        // Send request to generate offer via WalletConnect
        const currentChainId = this.getChainId();
        const resultOffer: resultOffer = await signClient.request({
          topic: this.topic,
          chainId: currentChainId,
          request: {
            method: "chia_createOfferForIds",
            params: {
              fingerprint: this.selectedFingerprint,
              offer: compressedOffer,
              fee,
              driverDict: {},
              disableJSONFormatting: true,
            },
          },
        });

        if (resultOffer.error) {
          toast.error(resultOffer.error?.data.error)
          // Set offer rejected: true
          store.dispatch(setOfferRejected(true));
        } else if (resultOffer.data) {
          store.dispatch(setRequestStep(null))
          return resultOffer.data.offer;
        }

    } catch (_error) {
      store.dispatch(setOfferRejected(true));
    }
    
  }

  getBalance(): void {
    // WalletConnect balance retrieval logic
  }

  async getWallets(): Promise<WalletsResponse | undefined> {
    // Sign client
    const signClient = await this.signClient();
    
    // Fetch previous connection
    try {
        if (!this.topic || !signClient) {
          toast.error('Not connected via WalletConnect or could not sign client', { id: 'failed-to-sign-client' })
          return;
        }
        
        try {
          // Send request to get Wallets via WalletConnect
          const currentChainId = this.getChainId();
          const request: Promise<wallets> = signClient.request({
            topic: this.topic,
            chainId: currentChainId,
            request: {
              method: "chia_getWallets",
              params: {
                fingerprint: this.selectedFingerprint,
                includeData: true
              },
            },
          });

          const wallets = await request;
          
          if (wallets.isSuccess) {
            return { isSage: false, wallets };
          } else {
            throw Error('Fetching wallet request unsuccessful')
          }
        } catch (error: unknown) {
          if (isWalletConnectError(error) && error.code === 4001 && error.message === "Unsupported method: chia_getWallets") {
            return {
              isSage: true,
              wallets: null,
            };
          } else {
            throw error;
          }
        }
        
      } catch (error: unknown) {
        if (isWalletConnectError(error)) {
          logger.error('Error generating offer:', error.message);
        } else {
          logger.error('Error generating offer:', error);
        }
    }
  }

  async addAsset(assetId: string, symbol: string, logo: string, fullName: string): Promise<void | boolean> {
    const displayName = `${fullName} (${symbol})`

    // Sign client
    const signClient = await this.signClient();
    
    // Fetch previous connection
    try {
        if (!this.topic || !signClient) {
          toast.error('Not connected via WalletConnect or could not sign client', { id: 'failed-to-sign-client' })
          throw Error('Not connected via WalletConnect or could not sign client');
        }

        // Send request to get Wallets via WalletConnect
        const currentChainId = this.getChainId();
        const request = signClient.request({
          topic: this.topic,
          chainId: currentChainId,
          request: {
            method: "chia_addCATToken",
            params: {
              fingerprint: this.selectedFingerprint,
              name: displayName,
              assetId: assetId
            },
          },
        });

        await request;
        return true;

    } catch (error: unknown) {
      if (isWalletConnectError(error)) {
        logger.error(`Wallet - ${error.message}`);
      } else {
        logger.error(`Wallet -`, error);
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Verify connection using CHIA_GET_ADDRESS method (Sage wallet method)
   * This is used to verify that the connection is working correctly
   */
  async verifyConnectionWithSageMethod(): Promise<string | null> {
    logger.debug('verifyConnectionWithSageMethod: Starting verification...');
    
    let signClient;
    let topic;
    try {
      signClient = await this.signClient();
      const state = store.getState();
      topic = state.walletConnect.selectedSession?.topic || this.topic;
      
      if (!topic || !signClient) {
        logger.debug('verifyConnectionWithSageMethod: No topic or signClient available');
        throw Error('Not connected via WalletConnect or could not sign client');
      }
      
      logger.debug('verifyConnectionWithSageMethod: Using method:', SageMethods.CHIA_GET_ADDRESS);
      logger.debug('verifyConnectionWithSageMethod: Topic:', topic);
      const currentChainId = this.getChainId();
      logger.debug('verifyConnectionWithSageMethod: ChainId:', currentChainId);
      
      const request = signClient.request<{address: string}>({
        topic: topic as string,
        chainId: currentChainId,
        request: {
          method: SageMethods.CHIA_GET_ADDRESS,
          params: {},
        },
      });
      
      logger.debug('verifyConnectionWithSageMethod: Request sent, awaiting response...');
      const response = await request;
      
      logger.debug('verifyConnectionWithSageMethod: Response received:', response);
      const address = response?.address || null;
      
      if (address) {
        logger.debug('verifyConnectionWithSageMethod: Success! Address:', address);
        store.dispatch(setAddress(address));
      } else {
        logger.debug('verifyConnectionWithSageMethod: No address in response');
      }
      
      return address;
    } catch (error: unknown) {
      logger.debug('verifyConnectionWithSageMethod: Error occurred:', error);
      if (isWalletConnectError(error) && error.code === 4001) {
        logger.debug('verifyConnectionWithSageMethod: Method not supported (4001), wallet may not be Sage');
      }
      throw error;
    }
  }

  async getAddress(): Promise<string | null> {
    logger.debug('getAddress: Starting address fetch...');

    let signClient: SignClient | undefined;
    let topic: string | undefined;
    let selectedSession: SessionTypes.Struct | null | undefined;
    let fingerprint: number | undefined;
    let wallet_id: number | undefined;
    try {
      const clientResult = await this.signClient();
      if (!clientResult) {
        logger.debug('getAddress: SignClient not available');
        toast.error('Not connected via WalletConnect or could not sign client', { id: 'failed-to-sign-client' });
        throw Error('Not connected via WalletConnect or could not sign client');
      }
      signClient = clientResult;
      
      const state = store.getState();
      topic = state.walletConnect.selectedSession?.topic;
      if (!topic) {
        logger.debug('getAddress: No topic available');
        toast.error('Not connected via WalletConnect', { id: 'failed-to-sign-client' });
        throw Error('Not connected via WalletConnect');
      }
      
      const session = state?.walletConnect?.selectedSession;
      if (!session || session === null) {
        logger.debug('getAddress: No selected session');
        return null;
      }
      selectedSession = session as SessionTypes.Struct;
      fingerprint = state.walletConnect.selectedFingerprint[selectedSession.topic];
      if (fingerprint === undefined || fingerprint === null) {
        logger.debug('getAddress: No fingerprint selected');
        return null;
      }
      const fingerprintValue = fingerprint; // Type guard
      wallet_id = selectedSession?.namespaces?.chia?.accounts.findIndex(account => account.includes(fingerprintValue.toString()));
      logger.debug('getAddress: Wallet ID:', wallet_id);
      if (wallet_id === undefined || wallet_id === -1) {
        logger.debug('getAddress: Wallet ID is undefined or not found');
        return null;
      }
      // Get chain ID - prefer session's chain ID to avoid mismatches
      const currentChainId = this.getChainId();
      
      // Log session info for debugging
      logger.debug('getAddress: Session info', {
        topic,
        sessionChains: selectedSession?.namespaces?.chia?.chains,
        sessionAccounts: selectedSession?.namespaces?.chia?.accounts?.slice(0, 1), // Log first account only
        usingChainId: currentChainId,
      });
      
      logger.debug('getAddress: Requesting address with method chia_getCurrentAddress', {
        topic,
        chainId: currentChainId,
        method: "chia_getCurrentAddress",
        params: {
          fingerprint: fingerprint,
          wallet_id,
          new_address: false
        },
      });

      const request = signClient.request<{data: string}>({
        topic,
        chainId: currentChainId,
        request: {
          method: "chia_getCurrentAddress",
          params: {
            fingerprint: fingerprint,
            wallet_id,
            new_address: false
          },
        },
      });
      const response = await request;

      logger.debug('getAddress: Address request response received:', response);
      const address = response?.data || null;
      if (address) {
        logger.debug('getAddress: Success! Address retrieved:', address);
        store.dispatch(setAddress(address));
      } else {
        logger.debug('getAddress: No address in response');
      }
      return address;
    } catch (error: unknown) {
      // Check if error is about invalid chain ID
      const isInvalidChainId = isWalletConnectError(error) && 
        (error.message?.includes("Missing or invalid") && error.message?.includes("chainId") ||
         error.message?.includes("Invalid chainId"));
      
      // If chain ID mismatch, try the alternative chain ID
      if (isInvalidChainId && selectedSession && signClient && fingerprint !== undefined && wallet_id !== undefined) {
        logger.warn('Chain ID mismatch detected, trying alternative chain ID');
        const state = store.getState();
        const network = selectNetwork(state);
        const alternativeChainId = network === 'mainnet' ? 'chia:testnet' : 'chia:mainnet';
        
        try {
          logger.debug('Retrying with alternative chain ID:', alternativeChainId);
          if (!signClient || !topic) {
            throw new Error('SignClient or topic not available for retry');
          }
          const retryRequest = signClient.request<{data: string}>({
            topic,
            chainId: alternativeChainId,
            request: {
              method: "chia_getCurrentAddress",
              params: {
                fingerprint: fingerprint,
                wallet_id,
                new_address: false
              },
            },
          });
          const retryResponse = await retryRequest;
          const address = retryResponse?.data || null;
          if (address) {
            logger.info('Successfully retrieved address with alternative chain ID');
            store.dispatch(setAddress(address));
            return address;
          }
        } catch (retryError) {
          logger.error('Retry with alternative chain ID also failed:', retryError);
        }
      }
      
      // Check for various error formats that indicate the method is not supported
      const isUnsupportedMethod = isWalletConnectError(error) && 
        error.code === 4001 && 
        (error.message === "Unsupported method: chia_getCurrentAddress" ||
         error.message.includes("Missing or invalid") && error.message.includes("chia_getCurrentAddress") ||
         error.message.includes("request() method: chia_getCurrentAddress"));
      
      if (isUnsupportedMethod) {
        logger.debug('getAddress: chia_getCurrentAddress not supported, trying Sage method chia_getAddress');
        logger.info("Sage wallet detected, using chia_getAddress method");

        try {
          const currentChainId = this.getChainId();
          const request = (signClient as SignClient).request<{address: string}>({
            topic: topic as string,
            chainId: currentChainId,
            request: {
              method: "chia_getAddress",
              params: {},
            },
          });
          const response = await request;
          
          logger.debug('getAddress: Sage address response received:', response);
          const address = response.address;
          if (address) {
            logger.debug('getAddress: Success! Sage address retrieved:', address);
            store.dispatch(setAddress(address));
          }
          return address;
        } catch (sageError) {
          logger.error('getAddress: Sage method also failed:', sageError);
          return null;
        }
      }
      logger.error('getAddress: Error getting address:', error);
      return null;
    }
  }

  async getAllSessions() {
    const signClient = await this.signClient();
    if (signClient) return signClient.session.getAll();
  }

  /**
   * Set up a MutationObserver to watch for theme changes (dark class on documentElement)
   * and update the WalletConnect modal theme accordingly.
   * Uses a global singleton observer to prevent multiple observers on the same element.
   */
  setupThemeObserver() {
    // Use global modal if available, otherwise use instance modal
    const modal = globalWalletConnectModal || this.modal;
    if (typeof window === 'undefined' || !modal) {
      return;
    }

    // If global observer already exists, don't create another one
    if (globalModalThemeObserver) {
      logger.debug('Theme observer already exists, skipping setup');
      // Still update instance reference for backwards compatibility
      this.modalThemeObserver = globalModalThemeObserver;
      return;
    }

    // Create global observer to watch for class changes on documentElement
    globalModalThemeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          const newTheme = isDark ? 'dark' : 'light';
          
          try {
            // Update modal theme using the global modal instance
            logger.debug('Theme changed, updating WalletConnect modal', { theme: newTheme });
            
            // If the modal has a method to update theme, use it
            // Otherwise, the theme will be applied on next modal open
            interface ModalWithTheme {
              setTheme?: (theme: string) => void;
            }
            const modalWithTheme = (globalWalletConnectModal || modal) as ModalWithTheme;
            if (modalWithTheme && typeof modalWithTheme.setTheme === 'function') {
              modalWithTheme.setTheme(newTheme);
            }
          } catch (error) {
            logger.error('Failed to update modal theme:', error);
          }
        }
      });
    });

    // Start observing the documentElement for class changes
    globalModalThemeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Update instance reference for backwards compatibility
    this.modalThemeObserver = globalModalThemeObserver;

    logger.debug('Theme observer set up for WalletConnect modal');
  }

  async signClient(): Promise<void | Client> {
    // If client has been saved to object, return that instead of completing a new sign
    if (this.client) return this.client;

    // Use global singleton to prevent multiple initializations
    if (globalSignClient) {
      this.client = globalSignClient;
      return globalSignClient;
    }

    // If initialization is in progress, wait for it
    if (globalSignClientPromise) {
      const client = await globalSignClientPromise;
      this.client = client;
      return client;
    }

    try {
      const projectId = SIGN_CLIENT_CONFIG.projectId;

      if (!projectId) {
        throw new Error('WalletConnect project ID is not configured. Please set WALLET_CONNECT_PROJECT_ID or NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID in your .env file.');
      }

      // Create a filtered pino logger that suppresses non-critical WalletConnect errors
      // WalletConnect logs non-critical internal errors (pairing cleanup, history restore, etc.)
      // that don't affect functionality but clutter the console
      const createFilteredLogger = () => {
        const baseLogger = SIGN_CLIENT_CONFIG.logger;
        
        // Map log level strings to pino levels
        const levelMap: Record<string, pino.Level> = {
          'error': 'error',
          'warn': 'warn',
          'info': 'info',
          'debug': 'debug',
          'trace': 'trace',
        };
        
        const logLevel = levelMap[baseLogger] || 'error';
        
        // Create a custom stream that filters non-critical messages
        const filteredStream = {
          write: (chunk: string) => {
            try {
              const logObj = JSON.parse(chunk);
              const context = logObj.context || '';
              const msg = logObj.msg || '';
              
              // Skip these non-critical errors that don't affect functionality
              const nonCriticalPatterns = [
                'core/pairing/pairing',
                'core/history',
                'Restore will override',
                'failed to process an inbound message',
                'onRelayMessage',
                'Pairing not found',
              ];
              
              const shouldSkip = nonCriticalPatterns.some(pattern => 
                context.includes(pattern) || msg.includes(pattern) || chunk.includes(pattern)
              );
              
              if (!shouldSkip) {
                // Use console methods based on log level
                // These console calls are intentional for WalletConnect's internal pino logger
                // eslint-disable-next-line no-console
                const level = logObj.level || 50;
                if (level >= 50) {
                  // eslint-disable-next-line no-console
                  console.error(chunk);
                } else if (level >= 40) {
                  if (logLevel === 'warn' || logLevel === 'info' || logLevel === 'debug' || logLevel === 'trace') {
                    // eslint-disable-next-line no-console
                    console.warn(chunk);
                  }
                } else if (level >= 30 && (logLevel === 'info' || logLevel === 'debug' || logLevel === 'trace')) {
                  // eslint-disable-next-line no-console
                  console.info(chunk);
                } else if (level >= 20 && (logLevel === 'debug' || logLevel === 'trace')) {
                  // eslint-disable-next-line no-console
                  console.debug(chunk);
                } else if (level >= 10 && logLevel === 'trace') {
                  // eslint-disable-next-line no-console
                  console.trace(chunk);
                }
              }
            } catch (_e) {
              // If parsing fails, log it normally (shouldn't happen with pino)
              if (logLevel === 'error' || logLevel === 'warn') {
                // eslint-disable-next-line no-console
                console.error(chunk);
              }
            }
          }
        };
        
        // Create pino logger with filtered stream
        return pino({
          level: logLevel,
        }, filteredStream);
      };

      // Use custom metadata if provided, otherwise use default from config
      const metadata = this.metadata ? {
        name: this.metadata.name || SIGN_CLIENT_CONFIG.metadata.name,
        description: this.metadata.description || SIGN_CLIENT_CONFIG.metadata.description,
        url: this.metadata.url || SIGN_CLIENT_CONFIG.metadata.url,
        icons: this.metadata.icons || SIGN_CLIENT_CONFIG.metadata.icons,
      } : SIGN_CLIENT_CONFIG.metadata;

      interface SignClientInitOptions {
        logger: ReturnType<typeof createFilteredLogger>;
        projectId: string;
        metadata: typeof SIGN_CLIENT_CONFIG.metadata;
        relayUrl?: string;
      }

      const initOptions: SignClientInitOptions = {
        // Use custom filtered logger or standard logger based on config
        logger: createFilteredLogger(),
        projectId: projectId,
        metadata: metadata,
      };

      // Add relay URL if provided
      if (SIGN_CLIENT_CONFIG.relayUrl) {
        initOptions.relayUrl = SIGN_CLIENT_CONFIG.relayUrl;
      }

      // Create initialization promise to prevent concurrent initializations
      globalSignClientPromise = SignClient.init(initOptions).then((signClient) => {
        globalSignClient = signClient;
        this.client = signClient;
        globalSignClientPromise = null;
        return signClient;
      });

      const signClient = await globalSignClientPromise;
      
      // Initialize native WalletConnect modal for desktop (not iOS)
      // iOS uses custom modal with better clipboard support
      // Use global singleton modal to prevent duplicate custom element registrations
      if (!isIOS() && typeof window !== 'undefined') {
        if (!globalWalletConnectModal) {
          const currentChainId = this.getChainId();
          const modalConfig = getModalConfig(currentChainId);
          if (modalConfig) {
            try {
              globalWalletConnectModal = new WalletConnectModal(modalConfig);
              logger.debug('Native WalletConnect modal initialized for desktop', { theme: modalConfig.themeMode });
              
              // Set up theme observer to update modal when theme changes
              // Only set up observer once globally for the global modal
              if (!globalModalThemeObserver) {
                this.setupThemeObserver();
              }
            } catch (modalError) {
              logger.error('Failed to initialize WalletConnect modal:', modalError);
              // Continue without modal - fallback to custom implementation
            }
          } else {
            logger.warn('WalletConnect modal not initialized: projectId is required');
          }
        }
        // Always use the global modal instance (convert null to undefined for type compatibility)
        this.modal = globalWalletConnectModal ?? undefined;
      }
      
      return signClient;
    } catch (e) {
      // Clear the promise on error so retry is possible
      globalSignClientPromise = null;
      toast.error(`Wallet - ${e}`)
      throw e; // Re-throw to allow calling code to handle the error
    }
  }

  async detectEvents(): Promise<void> {

    // Sign client
    const signClient = await this.signClient();
    if (!signClient) return


    // If user disconnects from UI or wallet, refresh the page
    signClient.on("session_delete", async ({ id, topic }) => {

      // Check localstorage and ensure it is removed from there
      // await this.deleteTopicFromLocalStorage(topic);
      await this.updateSessions();
      await this.updateConnectedWalletOnDisconnect(topic);
    })

  }

}

export default WalletConnectIntegration;
