# Wallet Connect Plugin for Chia Network

A WalletConnect integration plugin for the Chia blockchain. This plugin provides a complete WalletConnect implementation that can be easily integrated into any Chia-based application.

## Features

- **WalletConnect v2 Support**: Full integration with WalletConnect Sign Client
- **Session Management**: Connect, manage, and disconnect multiple wallet sessions
- **QR Code Pairing**: Display QR codes for easy wallet pairing
- **Manual URI Copy**: Copy pairing URIs manually for advanced users
- **Address Management**: Get and display wallet addresses
- **Asset Management**: Add CAT tokens to connected wallets
- **Offer Generation**: Generate offers for Chia transactions
- **Dark Mode Support**: Full dark/light mode support - all components automatically adapt to theme changes

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_WALLET_CONNECT_RELAY_URL=wss://relay.walletconnect.com
NEXT_PUBLIC_CHIA_NETWORK=testnet

# WalletConnect Metadata (optional)
NEXT_PUBLIC_WALLET_CONNECT_METADATA_NAME=Wallet Connect
NEXT_PUBLIC_WALLET_CONNECT_METADATA_DESCRIPTION=Wallet Connect for Chia blockchain
NEXT_PUBLIC_WALLET_CONNECT_METADATA_URL=https://example.com
NEXT_PUBLIC_WALLET_CONNECT_METADATA_ICONS=https://example.com/logo.jpg
```

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build

Build the production version:

```bash
npm run build
# or
yarn build
# or
pnpm build
```

### Start Production Server

```bash
npm start
# or
yarn start
# or
pnpm start
```

## Usage as a Package/Plugin

### Installation

Install the package in your project:

```bash
npm install @chia/wallet-connect
# or
yarn add @chia/wallet-connect
# or
pnpm add @chia/wallet-connect
```

### Setup

#### 1. Import Styles

**Important**: You must import the package styles in your app's main entry point:

```tsx
// In your _app.tsx, layout.tsx, or main.tsx
import '@chia/wallet-connect/styles';
```

#### 2. Configure Tailwind CSS (if using Tailwind)

**Option A: Merge the package's Tailwind config (Recommended)**

Import and merge the package's Tailwind configuration to ensure all styles and theme extensions are included:

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
    './node_modules/@chia/wallet-connect/dist/**/*.{js,ts,jsx,tsx}', // Important: Add this
  ],
  // You can extend the theme further if needed
  theme: {
    ...packageConfig.theme,
    extend: {
      ...packageConfig.theme.extend,
      // Your custom extensions
    },
  },
}
```

**Option B: Manual configuration**

If you prefer not to merge the config, manually add the package to your Tailwind content paths and include the theme extensions:

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class', // Required for dark mode support
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './node_modules/@chia/wallet-connect/dist/**/*.{js,ts,jsx,tsx}', // Important: Add this
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
  plugins: [],
}
```

**Important Notes:**
- The `content` array **must** include the package's dist files so Tailwind can scan for class names
- The `darkMode: 'class'` setting is required for proper dark mode support
- Make sure your PostCSS config includes Tailwind and Autoprefixer

#### 3. Dark Mode Support

The package includes full dark mode support out of the box. Components automatically adapt to dark mode when the `dark` class is present on the `<html>` or `<body>` element.

**Enable Dark Mode:**

```tsx
// Toggle dark mode by adding/removing the 'dark' class
// Option 1: Manual toggle
const toggleDarkMode = () => {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
};

// Option 2: React hook example
import { useEffect, useState } from 'react';

function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check localStorage or system preference
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = stored === 'dark' || (!stored && prefersDark);
    
    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggle = () => {
    const newValue = !isDark;
    setIsDark(newValue);
    if (newValue) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return [isDark, toggle] as const;
}
```

**All components automatically support dark mode:**
- `ConnectButton` - Adapts colors for dark/light themes
- `ConnectWalletModal` - Full dark mode styling
- `Modal` - Dark background and text colors
- `WalletConnectQR` - Dark mode compatible QR display
- All other components - Fully theme-aware

#### 4. Setup Redux Provider

Wrap your app with the Redux Provider:

```tsx
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@chia/wallet-connect';

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {/* Your app */}
      </PersistGate>
    </Provider>
  );
}
```

### Basic Usage

#### Use the Connect Button

```tsx
import { ConnectButton } from '@chia/wallet-connect';

function MyComponent() {
  return (
    <div>
      {/* Default usage */}
      <ConnectButton />
      
      {/* Custom text */}
      <ConnectButton connectText="Connect Wallet" />
      
      {/* Custom text and styling */}
      <ConnectButton 
        connectText="My Custom Text" 
        className="custom-button-class"
      />
    </div>
  );
}
```

**ConnectButton Props:**
- `connectText?: string` - Text to display when wallet is not connected (default: "Manage Wallet")
- `className?: string` - Additional CSS classes to apply to the button

#### 3. Use WalletManager Programmatically

```tsx
import { WalletManager } from '@chia/wallet-connect';
import { useAppSelector } from '@chia/wallet-connect';

function MyComponent() {
  const walletManager = new WalletManager();
  const connectedWallet = useAppSelector(state => state.wallet.connectedWallet);
  
  const handleConnect = async () => {
    await walletManager.connect('WalletConnect');
  };
  
  return (
    <button onClick={handleConnect}>
      {connectedWallet ? 'Connected' : 'Connect Wallet'}
    </button>
  );
}
```

#### 4. Access Wallet State

```tsx
import { useAppSelector } from '@chia/wallet-connect';
import type { RootState } from '@chia/wallet-connect';

function WalletInfo() {
  const address = useAppSelector((state: RootState) => state.wallet.address);
  const connectedWallet = useAppSelector((state: RootState) => state.wallet.connectedWallet);
  
  return (
    <div>
      <p>Wallet: {connectedWallet}</p>
      <p>Address: {address}</p>
    </div>
  );
}
```

### Available Exports

#### Components
- `ConnectButton` - Button component for connecting wallets (accepts `connectText` and `className` props)
- `ConnectButtonProps` - TypeScript type for ConnectButton props
- `ConnectWalletModal` - Modal for wallet connection UI
- `WalletConnectQR` - QR code display component
- `WalletConnectSession` - Session management component
- `AddAssetButton` - Button to add assets to wallet
- `FingerprintListbox` - Fingerprint selector component

#### Core Utilities
- `WalletManager` - Main wallet management class
- `WalletConnect` - WalletConnect implementation class

#### Redux Store
- `store` - Redux store instance
- `persistor` - Redux persist instance
- `useAppDispatch` - Typed dispatch hook
- `useAppSelector` - Typed selector hook
- `RootState` - TypeScript type for root state
- `AppDispatch` - TypeScript type for dispatch

#### Redux Actions
- `setConnectedWallet` - Set connected wallet
- `setAddress` - Set wallet address
- `setCNSName` - Set CNS name
- `connectSession` - Connect WalletConnect session
- `setPairingUri` - Set pairing URI
- `selectSession` - Select active session
- `setSessions` - Set all sessions
- And more...

### Environment Variables

Make sure to set these environment variables in your project:

```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_WALLET_CONNECT_RELAY_URL=wss://relay.walletconnect.com
NEXT_PUBLIC_CHIA_NETWORK=testnet
```

### Styling

#### Import Styles

Import the package styles in your app's main entry point:

```tsx
// In your _app.tsx, layout.tsx, or main.tsx
import '@chia/wallet-connect/styles';
```

Or if using CSS modules:

```css
@import '@chia/wallet-connect/styles';
```

#### Troubleshooting Styling Issues

If styles are not appearing correctly:

1. **Verify CSS import**: Make sure you've imported the styles in your main entry point
2. **Check Tailwind content paths**: Ensure your `tailwind.config.js` includes the package's dist files:
   ```js
   content: [
     // ... your paths
     './node_modules/@chia/wallet-connect/dist/**/*.{js,ts,jsx,tsx}',
   ]
   ```
3. **Verify PostCSS config**: Ensure your `postcss.config.js` includes Tailwind:
   ```js
   module.exports = {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   }
   ```
4. **Rebuild Tailwind**: After updating your config, restart your dev server and rebuild
5. **Check dark mode**: If using dark mode, ensure `darkMode: 'class'` is set in your Tailwind config and the `dark` class is on your `<html>` element
6. **Merge package config**: Use Option A in the setup section to automatically include all required theme extensions

#### Dark Mode Troubleshooting

If dark mode isn't working:

1. **Verify `dark` class**: Check that `document.documentElement.classList.contains('dark')` returns `true` when dark mode should be active
2. **Check Tailwind config**: Ensure `darkMode: 'class'` is set in your Tailwind config (included when merging package config)
3. **Inspect components**: Use browser dev tools to verify `dark:` classes are being applied
4. **Clear cache**: Sometimes Tailwind needs a rebuild to recognize dark mode classes

## Supported Wallets

- Sage Wallet
- Ozone Wallet
- Reference Wallet
- Any WalletConnect-compatible Chia wallet

## License

See LICENSE file for details.
