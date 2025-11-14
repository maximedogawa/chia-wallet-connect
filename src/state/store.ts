import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";

import completeWithWalletReducer from './completeWithWalletSlice.js';
import globalOnLoadDataReducer from './globalOnLoadDataSlice.js';
import walletConnectReducer from './walletConnectSlice.js';
import settingsModalReducer from './settingsModalSlice.js';
import walletReducer from './walletSlice.js';

// Use conditional storage for SSR compatibility
// For ESM, we use a synchronous import pattern that works in both browser and SSR
let storage: any;
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
    setItem(_key: string, value: any) {
      return Promise.resolve(value);
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
    setItem(_key: string, value: any) {
      return Promise.resolve(value);
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
  };
}

const rootReducer = combineReducers({
  completeWithWallet: completeWithWalletReducer,
  globalOnLoadData: globalOnLoadDataReducer,
  walletConnect: walletConnectReducer,
  settingsModal: settingsModalReducer,
  wallet: walletReducer,
});

const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  // walletConnect and wallet slices are persisted (not in blacklist)
  // This ensures connection state survives page refreshes
  blacklist: ['completeWithWallet', 'settingsModal', 'globalOnLoadData'],
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

export const useAppDispatch = () => useDispatch();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;