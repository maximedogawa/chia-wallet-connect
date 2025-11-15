import { useState, useEffect } from 'react';
import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Toaster } from 'react-hot-toast';
import { 
  store, 
  persistor, 
  WalletManager, 
  restoreConnectionStateImmediate 
} from '@maximEdogawa/chia-wallet-connect-react';
import Navbar from '../../dist/components/shared/navbar/Navbar';

export default function ClientApp({ Component, pageProps }: AppProps) {
  const [theme, setTheme] = useState<"dark" | "light" | "auto">("auto");
  
  useEffect(() => {
    const detectTheme = () => {
      if (localStorage.theme === 'dark') {
        document.documentElement.classList.add('dark');
        setTheme('dark');
      } else if (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
        setTheme('auto');
      } else {
        document.documentElement.classList.remove('dark');
        setTheme(localStorage.theme === 'light' ? 'light' : 'auto');
      }
    };
    
    detectTheme();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', detectTheme);
    return () => mediaQuery.removeEventListener('change', detectTheme);
  }, []);

  useEffect(() => {
    new WalletManager().detectEvents();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate 
        loading={null} 
        persistor={persistor}
        onBeforeLift={() => {
          // Restore WalletConnect connection state after Redux rehydration completes
          restoreConnectionStateImmediate().catch((error) => {
            console.error('Failed to restore WalletConnect connection state:', error);
          });
        }}
      >
        <div className="min-h-screen relative">
          <Navbar theme={theme} setTheme={setTheme} />
          <Toaster position="bottom-right" />
          <div className="flex flex-col px-4 pt-12 pb-24">
            <Component {...pageProps} />
          </div>
        </div>
      </PersistGate>
    </Provider>
  );
}

