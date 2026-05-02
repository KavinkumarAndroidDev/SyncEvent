import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/slices/authSlice';
import eventsReducer from '../features/events/slices/eventsSlice';
import metadataReducer from '../features/metadata/slices/metadataSlice';
import attendeeReducer from '../features/attendee/slices/attendeeSlice';
import adminReducer from '../features/admin/slices/adminSlice';
import bookingReducer from '../features/booking/slices/bookingSlice';
import organizerReducer from '../features/organizer/slices/organizerSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  events: eventsReducer,
  metadata: metadataReducer,
  attendee: attendeeReducer,
  admin: adminReducer,
  booking: bookingReducer,
  organizer: organizerReducer,
});

export default rootReducer;
