# Usage Guide

## Quick Start

### 1. Install the Package

```bash
npm install @chia/wallet-connect
```
### 2. Import Styles

```tsx
// _app.tsx or App.tsx
import '@chia/wallet-connect/styles';
```

### 3. Configure Tailwind CSS (Required if using Tailwind)

**Quick Setup (Recommended):**

```js
// tailwind.config.js
const packageConfig = require('@chia/wallet-connect/tailwind.config');

module.exports = {
  ...packageConfig,
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './node_modules/@chia/wallet-connect/dist/**/*.{js,ts,jsx,tsx}', // Required!
  ],
}
```

**Manual Setup:**

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './node_modules/@chia/wallet-connect/dist/**/*.{js,ts,jsx,tsx}', // Required!
  ],
  theme: {
    extend: {
      colors: {
        brandDark: '#526e78',
        brandLight: '#EFF4F7',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 }
        }
      },
      animation: {
        fadeIn: 'fadeIn .3s ease-in-out',
      },
    },
  },
}
```

### 4. Dark Mode Support (Optional)

The package fully supports dark mode! Components automatically adapt when the `dark` class is on the `<html>` element.

**Quick Setup:**

```tsx
// In your _app.tsx or layout component
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Check for saved theme preference or default to system preference
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (stored === 'dark' || (!stored && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return <Component {...pageProps} />;
}
```

**Toggle Dark Mode:**

```tsx
// Simple toggle function
const toggleDarkMode = () => {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', 
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
};
```

All components (`ConnectButton`, `Modal`, `ConnectWalletModal`, etc.) automatically support dark mode - no additional configuration needed!

### 5. Setup Redux Provider

```tsx
// _app.tsx or App.tsx
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@chia/wallet-connect';

export default function App({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Component {...pageProps} />
      </PersistGate>
    </Provider>
  );
}
```

### 6. Use Components

```tsx
import { ConnectButton } from '@chia/wallet-connect';

export default function HomePage() {
  return (
    <div>
      <h1>My Chia App</h1>
      
      {/* Default - shows "Manage Wallet" */}
      <ConnectButton />
      
      {/* Custom text */}
      <ConnectButton connectText="Connect Wallet" />
      
      {/* Custom text and styling */}
      <ConnectButton 
        connectText="Wallet" 
        className="bg-blue-500 text-white"
      />
    </div>
  );
}
```

#### ConnectButton Props

The `ConnectButton` component accepts the following props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `connectText` | `string` | `"Manage Wallet"` | Text displayed when wallet is not connected. Also used as fallback when address is unavailable. |
| `className` | `string` | `""` | Additional CSS classes to apply to the button. Merged with default styles. |

**Example with all props:**
```tsx
<ConnectButton 
  connectText="Connect Your Wallet"
  className="w-full max-w-xs shadow-lg"
/>
```

**Using the props type:**
```tsx
import type { ConnectButtonProps } from '@chia/wallet-connect';

const buttonProps: ConnectButtonProps = {
  connectText: "My Custom Text",
  className: "custom-class"
};

<ConnectButton {...buttonProps} />
```

## Advanced Usage

### Programmatic Wallet Connection

```tsx
import { WalletManager, useAppSelector } from '@chia/wallet-connect';

function CustomConnectButton() {
  const walletManager = new WalletManager();
  const isConnected = useAppSelector(state => state.wallet.connectedWallet !== null);
  
  const handleConnect = async () => {
    try {
      await walletManager.connect('WalletConnect');
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };
  
  return (
    <button onClick={handleConnect}>
      {isConnected ? 'Disconnect' : 'Connect Wallet'}
    </button>
  );
}
```

### Access Wallet State

```tsx
import { useAppSelector } from '@chia/wallet-connect';
import type { RootState } from '@chia/wallet-connect';

function WalletDisplay() {
  const address = useAppSelector((state: RootState) => state.wallet.address);
  const walletName = useAppSelector((state: RootState) => state.wallet.name);
  const sessions = useAppSelector((state: RootState) => state.walletConnect.sessions);
  
  return (
    <div>
      <p>Wallet: {walletName}</p>
      <p>Address: {address}</p>
      <p>Sessions: {sessions.length}</p>
    </div>
  );
}
```

### Generate Offers

```tsx
import { WalletManager } from '@chia/wallet-connect';
import type { generateOffer } from '@chia/wallet-connect';

async function createOffer() {
  const walletManager = new WalletManager();
  
  const requestAssets: generateOffer["requestAssets"] = [
    {
      assetId: "",
      hiddenPuzzleHash: null,
      amount: 1000000000000, // 1 XCH in mojos
      image_url: "",
      short_name: "XCH",
      name: "Chia"
    }
  ];
  
  const offerAssets: generateOffer["offerAssets"] = [
    {
      assetId: "your_cat_asset_id",
      hiddenPuzzleHash: null,
      amount: 1000,
      image_url: "",
      short_name: "TOKEN",
      name: "Token"
    }
  ];
  
  try {
    const offer = await walletManager.generateOffer(requestAssets, offerAssets, undefined);
    console.log('Generated offer:', offer);
  } catch (error) {
    console.error('Failed to generate offer:', error);
  }
}
```

### Add Assets to Wallet

```tsx
import { AddAssetButton } from '@chia/wallet-connect';

function TokenCard({ assetId, symbol, name, imageUrl }) {
  return (
    <div>
      <h3>{name}</h3>
      <AddAssetButton
        asset_id={assetId}
        short_name={symbol}
        image_url={imageUrl}
        name={name}
        onCompletion={(id) => console.log('Asset added:', id)}
      />
    </div>
  );
}
```

## Environment Variables

Required in your `.env.local`:

```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_WALLET_CONNECT_RELAY_URL=wss://relay.walletconnect.com
NEXT_PUBLIC_CHIA_NETWORK=testnet
```

Optional metadata:

```env
NEXT_PUBLIC_WALLET_CONNECT_METADATA_NAME=My App
NEXT_PUBLIC_WALLET_CONNECT_METADATA_DESCRIPTION=My Chia Application
NEXT_PUBLIC_WALLET_CONNECT_METADATA_URL=https://myapp.com
NEXT_PUBLIC_WALLET_CONNECT_METADATA_ICONS=https://myapp.com/logo.jpg
```

