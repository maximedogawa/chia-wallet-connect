/**
 * Sage Wallet Methods Enum
 *
 * This enum contains all the available methods for Sage wallet operations.
 * It provides type safety and prevents typos when using method names.
 */

export enum SageMethods {
  // CHIP-0002 Commands
  CHIP0002_CONNECT = 'chip0002_connect',
  CHIP0002_CHAIN_ID = 'chip0002_chainId',
  CHIP0002_GET_PUBLIC_KEYS = 'chip0002_getPublicKeys',
  CHIP0002_FILTER_UNLOCKED_COINS = 'chip0002_filterUnlockedCoins',
  CHIP0002_GET_ASSET_COINS = 'chip0002_getAssetCoins',
  CHIP0002_GET_ASSET_BALANCE = 'chip0002_getAssetBalance',
  CHIP0002_SIGN_COIN_SPENDS = 'chip0002_signCoinSpends',
  CHIP0002_SIGN_MESSAGE = 'chip0002_signMessage',
  CHIP0002_SEND_TRANSACTION = 'chip0002_sendTransaction',

  // Chia-specific Commands
  CHIA_CREATE_OFFER = 'chia_createOffer',
  CHIA_TAKE_OFFER = 'chia_takeOffer',
  CHIA_CANCEL_OFFER = 'chia_cancelOffer',
  CHIA_GET_NFTS = 'chia_getNfts',
  CHIA_SEND = 'chia_send',
  CHIA_GET_ADDRESS = 'chia_getAddress',
  CHIA_SIGN_MESSAGE_BY_ADDRESS = 'chia_signMessageByAddress',
  CHIA_BULK_MINT_NFTS = 'chia_bulkMintNfts',
}

/**
 * Asset ID constants for different Chia token types
 */
export enum AssetIds {
  XCH = 0,
}

export type SageMethodName = `${SageMethods}`

/**
 * Helper function to check if a string is a valid Sage method
 */
export function isSageMethod(method: string): method is SageMethodName {
  return Object.values(SageMethods).includes(method as SageMethods)
}

/**
 * Get all available Sage methods
 */
export function getAllSageMethods(): SageMethodName[] {
  return [
    SageMethods.CHIP0002_CONNECT,
    SageMethods.CHIP0002_CHAIN_ID,
    SageMethods.CHIP0002_GET_PUBLIC_KEYS,
    SageMethods.CHIP0002_FILTER_UNLOCKED_COINS,
    SageMethods.CHIP0002_GET_ASSET_COINS,
    SageMethods.CHIP0002_GET_ASSET_BALANCE,
    SageMethods.CHIP0002_SIGN_COIN_SPENDS,
    SageMethods.CHIP0002_SIGN_MESSAGE,
    SageMethods.CHIP0002_SEND_TRANSACTION,
    SageMethods.CHIA_CREATE_OFFER,
    SageMethods.CHIA_TAKE_OFFER,
    SageMethods.CHIA_CANCEL_OFFER,
    SageMethods.CHIA_GET_NFTS,
    SageMethods.CHIA_SEND,
    SageMethods.CHIA_GET_ADDRESS,
    SageMethods.CHIA_SIGN_MESSAGE_BY_ADDRESS,
    SageMethods.CHIA_BULK_MINT_NFTS,
  ]
}
