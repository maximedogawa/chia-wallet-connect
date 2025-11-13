import { useState, useEffect } from 'react';
import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import dynamic from 'next/dynamic';
import { Toaster } from 'react-hot-toast';
import store, { persistor } from '../../src/redux/store';
import WalletManager from '../../src/utils/walletIntegration/walletManager';

const Navbar = dynamic(() => import('../../src/components/shared/navbar/Navbar'), {
  ssr: false,
});

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
      <PersistGate loading={null} persistor={persistor}>
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

