import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from "redux-persist";

import appReducer from './appSlice.js';
import completeWithWalletReducer from './completeWithWalletSlice.js';
import globalOnLoadDataReducer from './globalOnLoadDataSlice.js';
import settingsModalReducer from './settingsModalSlice.js';
import walletConnectReducer from './walletConnectSlice.js';
import walletConnectNetworkReducer from './walletConnectNetworkSlice.js';
import walletReducer from './walletSlice.js';

// Use conditional storage for SSR compatibility
// For ESM, we use a synchronous import pattern that works in both browser and SSR
interface PersistStorageLike {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
let storage: PersistStorageLike;
if (typeof window !== 'undefined') {
  // In browser, use dynamic import (will be handled at runtime)
  import('redux-persist/lib/storage').then((module) => {
    storage = module.default;
  });
  // Fallback: create temporary storage until import completes
  storage = {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: string) {
      return Promise.resolve(undefined);
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
  };
} else {
  // Create a noop storage for SSR
  storage = {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, _value: string) {
      return Promise.resolve(undefined);
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
  };
}

const rootReducer = combineReducers({
  app: appReducer,
  completeWithWallet: completeWithWalletReducer,
  globalOnLoadData: globalOnLoadDataReducer,
  walletConnect: walletConnectReducer,
  walletConnectNetwork: walletConnectNetworkReducer,
  settingsModal: settingsModalReducer,
  wallet: walletReducer,
});

const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  blacklist: ['app', 'completeWithWallet', 'settingsModal', 'globalOnLoadData'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
