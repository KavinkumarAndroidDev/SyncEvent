# SyncEvent Frontend Logic Flow Documentation

This document explains the actual frontend logic currently implemented in the React app, from login through event discovery, booking, attendee dashboard flows, and the partial admin/organizer areas.

It is based on:

- frontend route and component code inside `src/`
- frontend Redux slices and API client logic
- backend/API behavior described in `api_documentation.md`

The goal of this document is to describe:

- what each page does
- how the user moves from one page to another
- which API calls happen on each screen
- where data is stored
- how auth/session state is managed
- which edge cases are already handled
- which areas are placeholders, partial, or mismatched

---

## 1. High-Level App Architecture

### Frontend stack

- React + Vite
- React Router for navigation
- Redux Toolkit for app-wide state
- Axios for API communication

### Main state containers

The app uses three Redux slices:

- `auth`
  - stores current `user`, `token`, auth `loading`, `error`, OTP state, registration success state
- `events`
  - stores public event listing data, loading, pagination info, and fetch errors
- `metadata`
  - stores categories and venues used for event filters and page metadata

### Persistent browser storage

The app uses `localStorage` for:

- `accessToken`
- `refreshToken`

These are the only explicitly persisted frontend values in the shared auth flow.

### Non-persistent state

The following are mostly managed in component state and are lost on refresh unless recreated:

- login form state
- OTP timer and entered OTP
- organizer registration step data
- search/filter state on some pages
- booking cart
- participant details during booking
- booking preview data
- selected modal records such as invoice/pass

---

## 2. Global App Boot Flow

### Entry behavior

The root layout is `src/App.jsx`.

On mount it immediately dispatches:

- `fetchCurrentUser()`
- `fetchMetadata()`

This means the app tries to:

1. restore the current user session if a token exists
2. preload categories and venues for public browsing/filtering

### Layout visibility rules

The root layout conditionally shows global chrome:

- Navbar is hidden on `/admin` and `/organizer`
- Footer is hidden on:
  - `/booking`
  - `/dashboard`
  - `/admin`
  - `/organizer`

This creates two layout modes:

- public site layout with navbar/footer
- dashboard/checkout layout with reduced distractions

### Important duplication in current auth boot logic

User restoration is triggered in two places:

- `App.jsx`
- `AuthLoader` in `src/router/router.jsx`

So if a token exists, `fetchCurrentUser()` may run more than once during initial load.

This is not fatal, but it does create redundant API traffic.

---

## 3. Routing and Access Control

All routes are defined in `src/router/router.jsx`.

### Public routes

- `/`
- `/events`
- `/events/:id`
- `/booking/:id`
- `/about`
- `/contact`
- `/register/organizer`

Important note:

- `/booking/:id` is not router-protected
- instead, the page itself performs runtime auth-role checks and shows a login-required screen when needed

### Guest-only routes

- `/login`
- `/register`

These are wrapped by `GuestRoute`.

### Protected attendee dashboard

- `/dashboard`
- `/dashboard/profile`
- `/dashboard/registrations`
- `/dashboard/past-events`
- `/dashboard/payments`

These are wrapped by `ProtectedRoute()` with no role restriction, so any logged-in user can technically pass the route gate.

In practice, the app expects attendees to use this area.

### Protected admin dashboard

- `/admin`
- all `/admin/*` child routes

These require `user.role === 'ADMIN'`.

### Protected organizer dashboard

- `/organizer`
- all `/organizer/*` child routes

These require:

- `user.role === 'ORGANIZER'`
- `user.verified !== false`

So unverified organizers are intentionally blocked from the organizer dashboard.

---

## 4. Authentication, Session, and Token Lifecycle

The auth logic is implemented in `src/features/auth/authSlice.js` and `src/api/axiosInstance.js`.

### 4.1 Initial auth state

On app boot:

- `auth.initialState.token` is read from `localStorage.getItem('accessToken')`
- `user` starts as `null`

So the app can start in a "token exists but user profile not yet loaded" state.

### 4.2 Current user fetch flow

`fetchCurrentUser()`:

1. calls `GET /users/me`
2. builds a sanitized frontend `user` object
3. if the role is `ORGANIZER`, it makes an additional call:
   - `GET /users/{id}/organizer-profile`
4. it stores `verified` on the frontend user object

If this process fails:

- frontend assumes the session is expired/invalid
- `user` is set to `null`
- `token` is cleared
- `accessToken` and `refreshToken` are removed from `localStorage`

### 4.3 Login with password

`loginUser(credentials)`:

1. calls `POST /auth/login`
2. stores `accessToken` and `refreshToken` in `localStorage`
3. builds frontend `user`
4. for organizers, also fetches organizer profile to derive `verified`

### 4.4 Login with OTP

This is a two-step flow:

1. `sendOtp(identifier)`
   - `POST /auth/send-otp`
2. `verifyOtp({ identifier, otp })`
   - `POST /auth/verify-otp`
   - stores access/refresh token
   - builds frontend `user`

### 4.5 Logout flow

`logoutUser()`:

1. calls `POST /auth/logout`
2. removes tokens from `localStorage`
3. clears frontend auth state

If backend logout fails:

- frontend still clears user state and removes tokens locally

So logout is fail-safe from the client perspective.

### 4.6 Axios request auth injection

Every outgoing request goes through the axios request interceptor:

- if `accessToken` exists in `localStorage`
- it attaches `Authorization: Bearer <token>`

### 4.7 Axios auto-refresh behavior

If a non-auth endpoint returns `401`:

1. axios checks that the request is not already a retry
2. reads `refreshToken` from `localStorage`
3. calls `POST /auth/refresh`
4. stores the new tokens
5. retries the original request once

If refresh fails:

- `localStorage.clear()` is called
- browser is redirected to `/login`

Important implication:

- all localStorage keys are removed, not just auth tokens
- this is broader than necessary but acceptable if auth is the only stored data

---

## 5. Role-Based Redirect Logic

### GuestRoute behavior

If a token does not exist:

- user may access `/login` and `/register`

If a token exists:

- admin is redirected to `/admin`
- verified organizer is redirected to `/organizer`
- attendee is redirected to `/dashboard`
- unverified organizer is allowed to remain on guest routes

Why unverified organizers are treated differently:

- they cannot enter organizer dashboard
- but the login screen wants to show the "not verified yet" message

### ProtectedRoute behavior

If no token:

- redirect to `/login`

If `allowedRoles` is provided and user role is not included:

- redirect to `/`

If organizer route requires organizer role and organizer is unverified:

- redirect to `/`

---

## 6. Shared Data Loading

### Events slice

The events slice is public-listing focused.

`fetchEvents(params)`:

- calls `GET /events`
- always forces `status: 'PUBLISHED'`
- default page size is `12`

Stored values:

- `list`
- `totalPages`
- `totalElements`
- `loading`
- `error`

### Metadata slice

`fetchMetadata()` loads:

- `GET /categories`
- `GET /venues`

Stored values:

- `categories`
- `venues`
- `loading`
- `loaded`
- `error`

This metadata is mainly used for:

- category browsing on home
- filter sidebar on events page

---

## 7. Page-by-Page Logic

### 7.1 Login Page

File: `src/pages/Login.jsx`

Purpose:

- allows user authentication using password login or OTP login

Logic flow:

1. User chooses password or OTP mode.
2. Password mode validates email and password, then dispatches `loginUser`.
3. OTP mode sends OTP via `sendOtp`, then verifies via `verifyOtp`.
4. On successful auth, role-based redirect happens.

Redirect rules:

- `ADMIN` -> `/admin`
- verified `ORGANIZER` -> `/organizer`
- `ATTENDEE` -> `/dashboard`
- unverified `ORGANIZER` remains on page and sees warning banner

Edge cases handled:

- invalid email format
- missing password
- missing OTP identifier
- invalid 6-digit OTP
- resend timer flow
- auth error clearing when input changes or mode changes
- unverified organizer login state

Storage and management:

- tokens stored in `localStorage`
- authenticated user stored in Redux `auth`
- OTP timer and form state stored locally in component state

Known gap:

- organizer registration redirects to login with route state message, but login page does not display that message

---

### 7.2 Attendee Registration Page

File: `src/pages/Register.jsx`

Purpose:

- registers a standard attendee account

Validation:

- full name required and minimum 3 chars
- email required and valid
- password must match strong regex
- phone optional but must be 10 digits if provided
- gender optional

Logic flow:

1. User fills form.
2. Frontend validates all required constraints.
3. Empty optional fields are removed from payload.
4. `registerUser` is dispatched.
5. On success, user is redirected to `/login`.

Edge cases handled:

- invalid email
- weak password
- invalid phone
- backend registration failure

Storage and management:

- no token is persisted on signup
- success flag is stored briefly in Redux and then cleared

Important mismatch:

- backend docs say registration returns tokens immediately, but frontend chooses not to treat it as auto-login

---

### 7.3 Organizer Registration / Upgrade Page

File: `src/pages/RegisterOrganizer.jsx`

Purpose:

- supports organizer signup as a separate account-creation flow

Flow:

- all users start on step 1
- guest and logged-in users see the same organizer signup flow
- being logged in does not convert the current attendee account into an organizer account
- logged-in users can access the page, but they still create a separate organizer account

Organizer signup flow:

1. Validate account details.
2. Validate organization name.
3. Call `POST /auth/register/organizer`.
4. Redirect to `/login`.

Edge cases handled:

- invalid new-user fields
- missing organization name
- API errors displayed as banner
- back navigation between steps for logged-out users

Storage and management:

- form state managed locally in component state
- logged-in path reuses Redux auth user data

Important mismatch:

- backend docs say `POST /users/{id}/organizer-profile` may not be implemented, but frontend relies on it

---

### 7.4 Home Page

File: `src/pages/Home.jsx`

Purpose:

- public landing page with featured events and category shortcuts

Logic flow:

1. On mount, dispatch `fetchEvents({ size: 10, sort: 'startTime,asc' })`.
2. Render featured events from Redux `events.list`.
3. Map hardcoded category cards against metadata categories to create filtered links.

Edge cases handled:

- loading featured events
- API error with retry button
- no events available
- unmatched category names fall back to plain `/events`

Storage and management:

- events come from Redux `events`
- categories come from Redux `metadata`

---

### 7.5 Events Listing Page

File: `src/pages/Events.jsx`

Purpose:

- browse public published events with search, filters, and pagination

State:

- `page`
- `search`
- `filters.categoryId`
- `filters.city`
- `filters.venueId`
- `filters.sort`

Logic flow:

1. Read optional `categoryId` from URL.
2. Whenever page/search/filter changes, dispatch `fetchEvents`.
3. Show loading, error, empty, or grid state.
4. Render pagination if multiple pages exist.

Edge cases handled:

- no matching events
- fetch failure with retry button
- clear filters resets page and URL query params
- pagination scrolls back to top

Storage and management:

- event data in Redux
- filter/search state in component state

Known gaps:

- `venueId` exists in state but no visible venue filter UI is wired
- search bar ignores incoming default value from page
- only `categoryId` is synced from URL, not the full filter state

---

### 7.6 Event Detail Page

File: `src/pages/EventDetail.jsx`

Purpose:

- show detailed event info and start booking/resume booking

Logic flow:

1. Fetch event details with `GET /events/{id}`.
2. If logged in as attendee, fetch active booking with `GET /bookings/event/{id}/active`.
3. On Book button click:
   - if not logged in: show login banner
   - if non-attendee: show role restriction banner
   - if active booking exists: navigate to booking page with `resumeBookingId`
   - else: navigate to fresh booking page

Edge cases handled:

- event fetch failure
- missing venue/address fields
- missing full description
- booking blocked for unauthenticated/non-attendee user
- resume pending booking

Storage and management:

- event and active booking stored in local component state only

---

### 7.7 Booking Page

File: `src/pages/BookingPage.jsx`

Purpose:

- handles full ticket selection, participant capture, and payment flow

Access rule:

- route is public at router level, but component itself blocks access unless user is logged in and role is `ATTENDEE`

Initial load flow:

1. Fetch event with `GET /events/{id}`.
2. Fetch tickets with `GET /events/{id}/tickets`.
3. If resuming:
   - fetch booking by ID
   - rebuild cart from booking items
   - regenerate preview
   - jump to payment step

Main states:

- `step`
- `cart`
- `participantsInfo`
- `discountCode`
- `preview`
- `currentBookingId`
- `successBookingId`
- `failureReason`
- `isResuming`

Ticket selection logic:

- total tickets capped at 10 per booking
- cart quantity below zero is prevented
- preview is cleared when cart changes

Participant step logic:

- participant rows are regenerated from cart quantities
- each row requires name, email, phone
- emails must be unique across participants

Payment/preview logic:

- discount preview uses `POST /bookings/preview`
- payment step also uses preview before actual booking creation

Fresh booking flow:

1. `POST /bookings`
2. save returned booking/order IDs
3. `GET /bookings/{bookingId}`
4. map registration items to participant payload
5. `POST /participants`
6. open Razorpay
7. on success -> `POST /payments/verify`

Resume payment flow:

1. `POST /payments/retry`
2. open Razorpay again

Failure handling:

- `POST /payments/fail` on dismissal/failure
- allow retry or cancel booking
- cancel uses `PATCH /bookings/{id}/status` to `CANCELLED`

Edge cases handled:

- unauthenticated/non-attendee access
- pending booking resume
- max 10 tickets
- invalid participant completion
- duplicate participant emails
- invalid discount code
- ticket sale not started / ended
- sale expiry race between frontend validation and backend booking
- active booking already exists
- Razorpay dismiss/failure
- backend verify failure
- session expiration during payment

Storage and management:

- cart and participant info are only local component state
- refresh during fresh booking loses unsaved participant entries
- resume flow depends on backend still retaining pending booking details

Important mismatch:

- backend docs imply participants may be created during payment verification, while frontend explicitly posts participants before verification

---

### 7.8 About Page

File: `src/pages/About.jsx`

Purpose and logic:

- static informational marketing page
- no API calls
- no persistence
- only navigation CTAs

---

### 7.9 Contact Page

File: `src/pages/Contact.jsx`

Purpose:

- collects user inquiry information in a form

Current behavior:

- fully frontend-only
- validates required fields
- on valid submit, just flips to success state
- no API request is made

Edge cases handled:

- missing required fields
- invalid email

Storage and management:

- form state and submitted state remain only in local component state

Important note:

- this page looks functional, but no data is stored or transmitted anywhere

---

### 7.10 Not Found Page

File: `src/pages/NotFound.jsx`

Purpose and logic:

- static fallback for unmatched routes
- provides navigation back to home

---

## 8. Attendee Dashboard Flows

### 8.1 Dashboard Shell

File: `src/pages/dashboard/AttendeeDashboard.jsx`

Purpose:

- provides sidebar shell for attendee dashboard routes
- displays user name and email from Redux auth state

Child routes:

- Overview
- Profile
- My Registrations
- Past Events
- Payments

---

### 8.2 Overview

File: `src/pages/dashboard/views/Overview.jsx`

Purpose:

- summary page for confirmed upcoming events and recent payment activity

Logic flow:

1. On mount fetch bookings and payments.
2. Compute upcoming confirmed events from booking payload.
3. Sort by nearest event time.
4. Show recent transactions list.

Edge cases handled:

- no upcoming events
- no payments
- loading state

Storage and management:

- bookings/payments are local page state only

Known gap:

- API errors are logged to console, not surfaced to user

---

### 8.3 Profile

File: `src/pages/dashboard/views/Profile.jsx`

Purpose:

- update attendee profile and change password using OTP verification

Profile update flow:

1. User edits full name, phone, gender.
2. `PUT /users/me` is called.
3. On success, modal is shown and current user is refetched.

Password reset flow:

1. Send OTP to user email via `POST /auth/send-otp`.
2. Enter OTP, new password, confirm password.
3. Submit via `POST /auth/reset-password`.

Edge cases handled:

- OTP already recently sent
- invalid OTP length
- expired/incorrect OTP
- password mismatch
- password too short
- backend error modal

Storage and management:

- all form state is local component state
- refreshed user profile is synced back into Redux after update

Known gap:

- password strength check here is weaker than signup validation

---

### 8.4 My Registrations

File: `src/pages/dashboard/views/MyRegistrations.jsx`

Purpose:

- show booking history and let user inspect/cancel bookings

Logic flow:

1. Fetch booking list.
2. Apply client-side search, status filter, sort, pagination.
3. `View Pass` fetches booking detail and opens modal.
4. `Cancel` triggers event policy fetch before enabling cancel confirmation.
5. If allowed, booking is cancelled and list is refreshed.

Edge cases handled:

- no registrations
- filter yields no results
- cancellation not allowed by event policy
- cancellation deadline passed
- event policy fetch failure

Storage and management:

- booking list and modal-selected booking live in local page state

Important note:

- visible table date is booking `createdAt`, not event date

---

### 8.5 Past Events

File: `src/pages/dashboard/views/PastEvents.jsx`

Purpose:

- show unique past confirmed events and collect feedback

Logic flow:

1. Fetch booking list.
2. Filter to past confirmed events.
3. Deduplicate by `eventId`.
4. Search/sort/paginate client-side.
5. On feedback submit, post comment payload.

Edge cases handled:

- no past events
- no search matches
- empty feedback not submitted
- feedback post failure

Storage and management:

- past event list, selected event, and feedback text stored locally in component state

Important mismatch:

- frontend calls `POST /feedback`
- backend docs describe `POST /events/{eventId}/feedbacks`

---

### 8.6 Payments

File: `src/pages/dashboard/views/Payments.jsx`

Purpose:

- show user payment history and invoice modal

Logic flow:

1. Fetch all user payments.
2. Search/filter/sort/paginate client-side.
3. Open invoice modal from already-loaded row data.
4. Allow print/download via `window.print()`.

Edge cases handled:

- no payment rows
- filtered empty state
- pagination

Storage and management:

- payment list and selected invoice stored in local page state

---

## 9. Admin Dashboard Flows

Files:

- `src/pages/dashboard/AdminDashboard.jsx`
- `src/pages/dashboard/views/admin/AdminOverview.jsx`
- `src/pages/dashboard/views/DashboardPlaceholder.jsx`

Current frontend status:

- route shell exists
- role protection exists
- logout flow exists
- overview exists
- most business pages are placeholders only

Placeholder sections:

- user management
- organizer approvals
- event approvals
- events
- offers
- categories
- venues
- tickets & registrations
- payments & revenue
- reports & analytics
- feedback moderation
- notifications
- profile

Meaning:

- backend support may exist, but frontend admin workflows are not yet implemented in detail

---

## 10. Organizer Dashboard Flows

Files:

- `src/pages/dashboard/OrganizerDashboard.jsx`
- `src/pages/dashboard/views/organizer/OrganizerOverview.jsx`
- `src/pages/dashboard/views/DashboardPlaceholder.jsx`

Access rule:

- user must be organizer and verified

Current frontend status:

- route shell exists
- verification gate exists
- logout flow exists
- overview exists
- actual organizer management pages are placeholders

Placeholder sections:

- My Events
- Create Event
- Ticket Management
- Registrations
- Payments
- Reports
- Notifications
- Profile

Meaning:

- organizer onboarding exists, but organizer operations UI is not completed yet

---

## 11. Navbar, Session UX, and Shared Navigation

File: `src/components/Navbar.jsx`

Logic:

- logged-out users see Login and Sign up buttons
- logged-in users see dashboard link, greeting, and logout button
- dashboard destination is role-based

Logout flow:

1. user opens confirmation modal
2. `logoutUser()` is dispatched
3. app navigates to `/`

Edge case:

- during initial session restoration, navbar may temporarily render logged-out state until user profile is fetched

---

## 12. Data Storage and State Ownership Summary

Stored in Redux:

- `auth.user`
- `auth.token`
- `auth.loading`
- `auth.error`
- `auth.otpSent`
- `auth.registerSuccess`
- `events.list`
- `events.totalPages`
- `events.totalElements`
- `metadata.categories`
- `metadata.venues`

Stored in `localStorage`:

- `accessToken`
- `refreshToken`

Stored only in local component state:

- login/OTP form values
- registration form values
- organizer form step values
- event detail record
- booking cart
- participant info
- discount preview
- selected pass
- selected invoice
- contact submit state

Server-side persistence implied by backend docs:

- users
- organizer profiles
- categories
- venues
- events
- tickets
- bookings / registration groups
- participants
- payments
- refunds
- feedback
- OTP records
- revoked tokens
- notifications

---

## 13. End-to-End Primary User Flows

### 13.1 Attendee Login to Booking Completion

1. Open `/login`.
2. Authenticate via password or OTP.
3. Tokens saved to `localStorage`.
4. User loaded into Redux.
5. Redirect to `/dashboard`.
6. Browse `/events`.
7. Open event detail.
8. Start booking.
9. Select tickets.
10. Enter participant details.
11. Preview amount and optional discount.
12. Create booking.
13. Complete Razorpay payment.
14. Verify payment.
15. Booking appears in dashboard history.

### 13.2 New Attendee Registration to Login

1. Open `/register`.
2. Complete validated form.
3. Frontend calls `POST /auth/register`.
4. Redirect to `/login`.
5. User logs in separately.

### 13.3 New Organizer Registration

1. Open `/register/organizer`.
2. Complete account step.
3. Complete organization step.
4. Frontend calls `POST /auth/register/organizer`.
5. Redirect to `/login`.
6. Organizer logs in.
7. Organizer remains blocked from verified organizer dashboard until approved.

### 13.4 Logged-in User Upgrade to Organizer

1. Logged-in user opens `/register/organizer`.
2. Page jumps to organization step.
3. Submit organizer profile request.
4. Frontend calls `POST /users/{id}/organizer-profile`.
5. Refresh current user.
6. User remains blocked from organizer dashboard until verified.

---

## 14. Edge Cases Already Managed Well

- invalid/expired access token clears session automatically
- refresh token flow retries one failed request on 401
- logout clears local auth even if backend logout fails
- unverified organizer cannot access organizer dashboard
- OTP login resend timer exists
- pending booking resume flow exists
- max 10 tickets rule exists
- sale window validation exists both before proceeding and before payment
- duplicate participant email check exists
- Razorpay dismissal/failure handling exists
- booking cancellation eligibility is checked before cancel submit
- most major screens have loading/empty/error branches

---

## 15. Known Gaps, Risks, and Mismatches

- `fetchCurrentUser()` is triggered from multiple places, causing duplicate requests.
- attendee dashboard route is protected only by login, not explicitly by attendee role.
- registration frontend does not auto-login even though backend docs say tokens may be returned on registration.
- organizer upgrade flow depends on `POST /users/{id}/organizer-profile`, but backend docs question that endpoint.
- frontend posts participants before payment verification, while backend docs imply participants may also be created during verification.
- past-events feedback endpoint used by frontend does not match documented backend endpoint.
- events search bar ignores initial default value.
- venue filter state exists but no venue selection UI is exposed.
- contact form does not persist or submit anything.
- admin and organizer operational pages are mostly placeholders.
- error handling style is inconsistent across the app.
- multiple date fields (`createdAt`, `eventDate`, `eventStartTime`) are used across views and should be contract-verified.

---

## 16. Final Practical Summary

Most complete frontend flow right now:

- attendee authentication
- public event discovery
- event detail view
- booking with payment
- attendee dashboard management afterward

Partially complete:

- organizer onboarding and verification-aware gating
- pending booking recovery/resume

Not complete in frontend yet:


- real organizer operations
- real admin operations
- real contact submission workflow

In short, the attendee journey is the strongest and most end-to-end-complete implementation in the current frontend.
