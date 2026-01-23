import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ChiaNetwork = 'mainnet' | 'testnet';

export interface WalletConnectNetworkState {
  network: ChiaNetwork;
}

// SLICES
/////////////////////////////////
const initialState: WalletConnectNetworkState = {
  network: 'mainnet', // Default to mainnet as requested
};

const walletConnectNetworkSlice = createSlice({
  name: 'walletConnectNetwork',
  initialState,
  reducers: {
    setNetwork(state, action: PayloadAction<ChiaNetwork>) {
      state.network = action.payload;
    },
  }
});

export const { setNetwork } = walletConnectNetworkSlice.actions;

// Selector for network
export const selectNetwork = (state: { walletConnectNetwork: WalletConnectNetworkState }): ChiaNetwork => 
  state.walletConnectNetwork.network;

export default walletConnectNetworkSlice.reducer;
