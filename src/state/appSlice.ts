import { createSlice } from "@reduxjs/toolkit";

export interface AppState {
  /** Incremented when document becomes visible; used to force connection UI to re-render after app switch */
  visibilityTick: number;
}

const initialState: AppState = {
  visibilityTick: 0,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    incrementVisibilityTick(state) {
      state.visibilityTick += 1;
    },
  },
});

export const { incrementVisibilityTick } = appSlice.actions;
export const selectVisibilityTick = (state: { app: AppState }) =>
  state.app?.visibilityTick ?? 0;
export default appSlice.reducer;
