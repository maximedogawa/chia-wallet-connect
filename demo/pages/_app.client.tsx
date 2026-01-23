import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Toaster } from 'react-hot-toast';
import { 
  store, 
  persistor, 
  WalletManager, 
  restoreConnectionStateImmediate 
} from '@maximedogawa/chia-wallet-connect-react';
import DemoNavbar from '../components/DemoNavbar';

export default function ClientApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const detectTheme = () => {
      if (localStorage.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
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
          <DemoNavbar />
          <Toaster position="bottom-right" />
          <div className="flex flex-col px-4 py-6">
            <Component {...pageProps} />
          </div>
        </div>
      </PersistGate>
    </Provider>
  );
}

