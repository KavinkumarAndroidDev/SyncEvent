import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/slices/authSlice';
import eventsReducer from '../features/events/slices/eventsSlice';
import metadataReducer from '../features/metadata/slices/metadataSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  events: eventsReducer,
  metadata: metadataReducer,
});

export default rootReducer;
