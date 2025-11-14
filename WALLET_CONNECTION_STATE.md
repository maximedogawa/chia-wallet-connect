# Accessing Wallet Connection State

This package provides several ways for your app to access and monitor the WalletConnect connection state.

## Using the `useWalletConnectionState` Hook (Recommended)

The easiest way to access connection state in your React components is using the `useWalletConnectionState` hook:

```tsx
import { useWalletConnectionState } from '@chia/wallet-connect';

function MyComponent() {
  const {
    isConnected,
    connectedWallet,
    address,
    isWalletConnect,
    walletConnectSession,
    walletImage,
    walletName,
    cnsName
  } = useWalletConnectionState();

  if (!isConnected) {
    return <div>No wallet connected</div>;
  }

  return (
    <div>
      <p>Connected to: {connectedWallet}</p>
      <p>Address: {address}</p>
      {isWalletConnect && walletConnectSession && (
        <p>Wallet: {walletConnectSession.peer.metadata.name}</p>
      )}
    </div>
  );
}
```

### Hook Return Values

- `isConnected: boolean` - Whether any wallet is connected
- `connectedWallet: string | null` - The name of the connected wallet (e.g., "WalletConnect") or null
- `address: string | null` - The wallet address or null
- `isWalletConnect: boolean` - Whether WalletConnect is the connected wallet
- `walletConnectSession: SessionTypes.Struct | null` - The active WalletConnect session or null
- `walletImage: string | null` - The wallet image/icon URL or null
- `walletName: string | null` - The wallet name or null
- `cnsName: string | null` - The CNS name (if available) or null

## Using Redux Store Directly

You can also access the state directly from the Redux store:

```tsx
import { store } from '@chia/wallet-connect';
import { useSelector } from 'react-redux';
import type { RootState } from '@chia/wallet-connect';

function MyComponent() {
  // Using useSelector hook
  const connectedWallet = useSelector((state: RootState) => state.wallet.connectedWallet);
  const address = useSelector((state: RootState) => state.wallet.address);
  const walletConnectSession = useSelector((state: RootState) => state.walletConnect.selectedSession);
  const walletConnectSessions = useSelector((state: RootState) => state.walletConnect.sessions);

  // Or access store directly (outside React components)
  const state = store.getState();
  const isConnected = state.wallet.connectedWallet === "WalletConnect" 
    ? Boolean(state.walletConnect.selectedSession)
    : Boolean(state.wallet.connectedWallet);
}
```

### Redux State Structure

#### `state.wallet`
- `connectedWallet: string | null` - Connected wallet name
- `address: string | null` - Wallet address
- `image: string | null` - Wallet image URL
- `name: string | null` - Wallet name
- `CNSName: string | null` - CNS name

#### `state.walletConnect`
- `sessions: SessionTypes.Struct[]` - All WalletConnect sessions
- `selectedSession: SessionTypes.Struct | null` - Currently selected/active session
- `selectedFingerprint: { [topic: string]: number }` - Fingerprint for each session
- `pairingUri: string | null` - Current pairing URI (if pairing)

## Checking Connection Status

### For WalletConnect specifically:

```tsx
import { useWalletConnectionState } from '@chia/wallet-connect';

function MyComponent() {
  const { isConnected, isWalletConnect, walletConnectSession } = useWalletConnectionState();

  // Check if WalletConnect is connected
  if (isWalletConnect && walletConnectSession) {
    // WalletConnect is connected and active
    const walletName = walletConnectSession.peer.metadata.name;
    const walletIcon = walletConnectSession.peer.metadata.icons[0];
    // ...
  }
}
```

### For any wallet:

```tsx
import { useWalletConnectionState } from '@chia/wallet-connect';

function MyComponent() {
  const { isConnected, connectedWallet, address } = useWalletConnectionState();

  if (isConnected) {
    return <div>Connected to {connectedWallet} at {address}</div>;
  }
  
  return <div>Not connected</div>;
}
```

## State Persistence

The connection state is automatically persisted to IndexedDB using `redux-persist`. This means:

- Connection state survives page refreshes
- State is automatically restored on app load
- No additional setup required

The following state is persisted:
- `wallet` slice (connectedWallet, address, image, name)
- `walletConnect` slice (sessions, selectedSession, selectedFingerprint)

## Example: Complete Component

```tsx
import { useWalletConnectionState } from '@chia/wallet-connect';
import { ConnectButton } from '@chia/wallet-connect';

function WalletStatus() {
  const {
    isConnected,
    connectedWallet,
    address,
    isWalletConnect,
    walletConnectSession,
    walletImage
  } = useWalletConnectionState();

  return (
    <div>
      <ConnectButton />
      
      {isConnected && (
        <div>
          <h3>Wallet Status</h3>
          <p>Connected: {connectedWallet}</p>
          <p>Address: {address}</p>
          
          {isWalletConnect && walletConnectSession && (
            <div>
              <p>Wallet: {walletConnectSession.peer.metadata.name}</p>
              <img 
                src={walletConnectSession.peer.metadata.icons[0]} 
                alt="Wallet icon" 
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

## TypeScript Types

All types are exported from the package:

```tsx
import type { 
  RootState, 
  SessionTypes 
} from '@chia/wallet-connect';
```

## Notes

- The `useWalletConnectionState` hook automatically updates when the connection state changes
- For WalletConnect, both `connectedWallet === "WalletConnect"` AND `selectedSession` must be truthy for the connection to be considered active
- The connection state is restored automatically after page refresh - no manual restoration needed
- Address may be `null` initially if it hasn't been fetched yet, but the connection is still valid

