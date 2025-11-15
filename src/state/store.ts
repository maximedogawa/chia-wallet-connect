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

import completeWithWalletReducer from './completeWithWalletSlice.js';
import globalOnLoadDataReducer from './globalOnLoadDataSlice.js';
import settingsModalReducer from './settingsModalSlice.js';
import walletConnectReducer from './walletConnectSlice.js';
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

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
