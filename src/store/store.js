import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import eventsReducer from '../features/events/eventsSlice';
import metadataReducer from '../features/metadata/metadataSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventsReducer,
    metadata: metadataReducer
  },
});

export default store;