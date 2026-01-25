import { configureStore } from '@reduxjs/toolkit';
import { windowSlice } from './ui/lib/WindowSlice';
import { inspectedBuildingSlice } from './ui/windows/building/inspectedBuildingSlice';
import { hotbarSlice } from './ui/components/hotbar/HotbarSlice';
import { resourceTooltipSlice } from './ui/components/resourceTooltip/ResourceTooltipSlice';

export const store = configureStore({
  reducer: {
    window: windowSlice.reducer,
    inspectedBuilding: inspectedBuildingSlice.reducer,
    hotbar: hotbarSlice.reducer,
    resourceTooltip: resourceTooltipSlice.reducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
