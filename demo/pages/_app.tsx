import { PersistGate } from 'redux-persist/integration/react';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';

// Import from the package source (for demo/testing)
// In production, other apps would import from '@chia/wallet-connect' (the built package)
import store, { persistor } from '../../src/redux/store';
import ConnectButton from '../../src/components/shared/navbar/walletIntegration/ConnectButton';
import '../../src/styles/globals.css';
import Navbar from '../../src/components/shared/navbar/Navbar';
import WalletManager from '../../src/utils/walletIntegration/walletManager';


export default function App({ Component, pageProps }: AppProps) {

  // Theme detector
  const [theme, setTheme] = useState<"dark" | "light" | "auto">("auto");
  useEffect(() => {
    const detectTheme = () => {
      if (typeof window !== 'undefined') {
        if (localStorage.theme === 'dark') {
          document.documentElement.classList.add('dark');
          setTheme('dark');
        } else if (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
          setTheme('auto')
        } else if (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: light)').matches) {
          document.documentElement.classList.remove('dark');
          setTheme('auto')
        } else {
          document.documentElement.classList.remove('dark');
          setTheme('light');
        }
      }
    }
    detectTheme()

    // Detect user preference change
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', detectTheme);

    return () => {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', detectTheme);
    };

  }, [theme]);

  // On page reload, wallet event listeners need to be re-established (i.e. if user disconnects from their wallet, the UI will update)
  const walletManager = new WalletManager();
  walletManager.detectEvents();

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <div className="min-h-screen relative">
          <Navbar theme={theme} setTheme={setTheme} />
          <Toaster position="bottom-right"
            toastOptions={{
              className: "!bg-brandLight/80 backdrop-blur w-full sm:w-auto !px-4 !py-3 !rounded-xl font-medium text-sm",
              loading: {
                duration: 45000,
                iconTheme: {
                  primary: "black",
                  secondary: "transparent"
                }
              },
              success: {
                iconTheme: {
                  primary: '#166534',
                  secondary: '#EFF4F7'
                }
              },
              error: {
                iconTheme: {
                  primary: '#B91C1C',
                  secondary: '#EFF4F7'
                }
              }
            }} />
          <div className="flex flex-col px-4">
            <div className="pt-12 pb-[96px]">
              <Component {...pageProps}  />
            </div>
          </div>
        </div>
      </PersistGate>
    </Provider>
  );
}
