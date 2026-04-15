# Event Management System - API Documentation

This document provides a comprehensive, endpoint-by-endpoint breakdown of the exact business logic, validations, and access controls implemented across the Event Management System, along with the status of planned endpoints. The platform follows a role-based architecture (`ADMIN`, `ORGANIZER`, `ATTENDEE`) and implements strict access control layers.

---

## 1. Authentication & Profile

### Logic Details

**`POST /api/auth/register`**
*   **Purpose:** Register a new user account.
*   **Access:** Public.
*   **Business Logic:** Triggers the user creation lifecycle. Normalizes the provided email (converts to lowercase) and phone number (strips non-digit characters). Validates that the email is strictly unique across the system. Assigns the default role of `ATTENDEE`. Upon successful persistence, immediately issues and returns standard JWT access and refresh tokens.

**`POST /api/auth/register/organizer`**
*   **Purpose:** Direct registration for organizer accounts.
*   **Access:** Public.
*   **Business Logic:** Combined flow that creates a system User with `ORGANIZER` role and simultaneously instantiates an `OrganizerProfile`. Ingests organization metadata (Name, Bio, Website, Social links). The profile is initialized as `verified = false`.

**`POST /api/auth/login`**
*   **Purpose:** Authenticate a user and issue JWT tokens.
*   **Access:** Public.
*   **Business Logic:** Securely verifies user credentials. To prevent user enumeration attacks, password verification is explicitly performed *before* checking the account status. If the password matches and the user's status is `ACTIVE`, JWT access and refresh tokens are authorized and generated.

**`POST /api/auth/refresh`**
*   **Purpose:** Obtain a fresh access token using a refresh token.
*   **Access:** Public (requires valid refresh token).
*   **Business Logic:** Validates the signature and token-type of the provided refresh token. Ensures the associated user account is still `ACTIVE`. If validations pass, issues a new pair of access and refresh tokens.

**`POST /api/auth/logout`**
*   **Purpose:** Securely log the user out and invalidate the active token.
*   **Access:** Any Authenticated User.
*   **Business Logic:** Extracts the Bearer token from the request. Appends the token to a database-backed revocation repository (blacklist), ensuring that this specific token cannot be used for any subsequent requests.

**`POST /api/auth/send-otp`**
*   **Purpose:** Initiate OTP flow for account verification or password reset.
*   **Access:** Public.
*   **Business Logic:** Generates a secure 6-digit random code. Persists the OTP in the database tied to the user's identifier (email/phone) with an exact expiration time (default is 2.5 minutes). Specifically blocks the generation/re-sending of a new OTP if a valid, unexpired OTP already exists for that identifier.

**`POST /api/auth/verify-otp`**
*   **Purpose:** Verify an OTP provided by the user.
*   **Access:** Public.
*   **Business Logic:** Checks the submitted OTP against the database for an exact match and ensures the expiration window hasn't passed. If successful, strictly marks the OTP as 'used' to prevent replay attacks and returns full authentication tokens for the user. 

**`POST /api/auth/reset-password`**
*   **Purpose:** Reset a user's password using a valid OTP.
*   **Access:** Public.
*   **Business Logic:** Intelligently verifies the OTP *inline* alongside the new password submission (meaning a prior separate call to `verify-otp` is not strictly enforced). Once the OTP is validated and marked used, the new password is hashed and updated.

**`GET /api/users/me`**
*   **Purpose:** Fetch the profile details of the currently logged-in user.
*   **Access:** Any Authenticated User.
*   **Business Logic:** Returns the sanitized profile data for the authenticated principal context.

**`PUT /api/users/me`**
*   **Purpose:** Update the logged-in user's profile information.
*   **Access:** Any Authenticated User.
*   **Business Logic:** Updates allowable profile fields (Name, Phone, Gender, Password). Re-runs the phone normalization logic (stripping non-digits) before persisting the update.

**`DELETE /api/users/me`**
*   **Purpose:** Delete the user's account.
*   **Access:** Any Authenticated User.
*   **Business Logic:** Performs a "Soft Delete". Changes the user's system status to `INACTIVE`. Does not physically drop the database row in order to maintain historical data integrity (e.g., past bookings and payments). (**NOT YET IMPLEMENTED IN CONTROLLER**)

### Mismatches vs. Design
- `POST /api/auth/logout` — Design specifies ATTENDEE role only. **Actual**: any authenticated user (`isAuthenticated()`).
- `POST /api/auth/refresh` — Present in the implementation and security permit-list but absent from the design table.
- `POST /api/auth/reset-password` — Design implies OTP must be pre-verified via `/verify-otp`. **Actual**: OTP is verified inline within the reset-password call itself; a prior verify-otp step is not required.
- `DELETE /api/users/me` — **Not implemented in controller layer**.
- `POST /api/auth/register/organizer` — Implemented but missing from original design.

### Status of Planned Endpoints
- [x] `POST /api/auth/register` (Implemented)
- [x] `POST /api/auth/register/organizer` (Implemented)
- [x] `POST /api/auth/login` (Implemented)
- [x] `POST /api/auth/logout` (Implemented — any authenticated role)
- [x] `POST /api/auth/send-otp` (Implemented)
- [x] `POST /api/auth/verify-otp` (Implemented)
- [x] `POST /api/auth/reset-password` (Implemented — OTP verified inline)
- [x] `POST /api/auth/refresh` (Implemented — not in original design table)
- [x] `GET /api/users/me` (Implemented)
- [x] `PUT /api/users/me` (Implemented)
- [ ] `DELETE /api/users/me` (**NOT IMPLEMENTED**)

---

## 2. Users (Admin Only)

### Logic Details

**`GET /api/users`**
*   **Purpose:** Retrieve a list of all registered users.
*   **Access:** Admin Only.
*   **Business Logic:** Returns a paginated and sortable list of users. Contains backend filter logic to selectively query by user `status` (`ACTIVE`, `INACTIVE`, `SUSPENDED`), specific `role`, or via a text `search` parameter that performs a pattern match against the users' names or emails.

**`GET /api/users/{id}`**
*   **Purpose:** Retrieve comprehensive details of a specific user.
*   **Access:** Admin Only.
*   **Business Logic:** Fetches complete profile data, bypassing standard user data sanitation, and aggregations such as an underlying registration/booking history summary.

**`PATCH /api/users/{id}/status`**
*   **Purpose:** Modify a user's operational status.
*   **Access:** Admin Only.
*   **Business Logic:** Allows forced administrative transition of a user's status between `ACTIVE`, `INACTIVE`, and `SUSPENDED`, directly impacting their ability to log in or interact with the system.

### Status of Planned Endpoints
- [x] `GET /api/users` (Implemented)
- [x] `GET /api/users/{id}` (Implemented)
- [x] `PATCH /api/users/{id}/status` (Implemented)

---

## 3. Organizer Profiles

### Logic Details

**`POST /api/users/{id}/organizer-profile`**
*   **Purpose:** Submit a request to become an organizer (Step-up).
*   **Access:** Any Authenticated User.
*   **Business Logic:** Ingests organization details (Name, Bio). Creates an organizer profile entity linked to the user. Explicitly initializes the profile's system state with `verified = false`. Enforces a strict validation that blocks duplicate profile submissions for the same user ID. (**NOT YET IMPLEMENTED IN CONTROLLER**)

**`GET /api/users/{id}/organizer-profile`**
*   **Purpose:** Fetch the details of a user's organizer profile.
*   **Access:** Authenticated Users (Self or Admin).
*   **Business Logic:** Returns the specific business/organizer details tied to the requested account.

**`PUT /api/users/{id}/organizer-profile`**
*   **Purpose:** Update organizer specific business info.
*   **Access:** Organizer / Profile Owner.
*   **Business Logic:** Modifies standard business metadata (Social Media Links, Website URIs, Company bio). 

**`GET /api/organizer-profiles`**
*   **Purpose:** Retrieve a list of organizer profiles.
*   **Access:** Admin Only.
*   **Business Logic:** Fetches a paginated list of organizers. Supports filtering, particularly `?status=PENDING` (which correctly maps under the hood to the `verified = false` database flag) for administrative reviews.

**`PATCH /api/organizer-profiles/{id}/status`**
*   **Purpose:** Manage the verification status of an organizer profile.
*   **Access:** Admin Only.
*   **Business Logic:** Facilitates the review workflow. Admins can transition the profile to `APPROVE` (updates the db flag to `verified = true`), `REJECT`, or `SUSPEND`.

### Mismatches vs. Design
- `POST /api/users/{id}/organizer-profile` — Design says PUBLIC. **Actual**: requires authentication (`isAuthenticated()`).
- `GET /api/users/{id}/organizer-profile/dashboard` — **Not implemented**.
- `POST /api/users/{id}/organizer-profile/images` — **Not implemented**.

### Status of Planned Endpoints
- [ ] `POST /api/users/{id}/organizer-profile` (**NOT IMPLEMENTED** — replaced by direct registration flow)
- [x] `GET /api/users/{id}/organizer-profile` (Implemented)
- [x] `PUT /api/users/{id}/organizer-profile` (Implemented)
- [ ] `GET /api/users/{id}/organizer-profile/dashboard` (**NOT IMPLEMENTED**)
- [ ] `POST /api/users/{id}/organizer-profile/images` (**NOT IMPLEMENTED**)
- [x] `GET /api/organizer-profiles` (Implemented)
- [x] `PATCH /api/organizer-profiles/{id}/status` (Implemented)

---

## 4. Categories

### Logic Details

**`GET /api/categories`**
*   **Purpose:** Retrieve event categories.
*   **Access:** Public.
*   **Business Logic:** Fetches a list of all defined categories. The system automatically filters the database result so that only categories with an `ACTIVE` status are exposed to the public caller.

**`GET /api/categories/{id}`**
*   **Purpose:** Retrieve a specific event category.
*   **Access:** Public.
*   **Business Logic:** Fetches the category details unconditionally, circumventing the `ACTIVE` filter present on the list endpoint (meaning any category record can be resolved directly by ID).

**`POST /api/categories`**
*   **Purpose:** Register a new category type.
*   **Access:** Admin Only.
*   **Business Logic:** Saves the category metadata. Implements database validation to ensure the category name is strictly unique across the system (enforced in a case-insensitive manner).

**`PUT /api/categories/{id}`**
*   **Purpose:** Update an existing category name/description.
*   **Access:** Admin Only.
*   **Business Logic:** Processes metadata updates. Maintains uniqueness validation.

**`PATCH /api/categories/{id}/status`**
*   **Purpose:** Toggle category state.
*   **Access:** Admin Only.
*   **Business Logic:** Toggling a category to `INACTIVE` effectively hides it from the public `GET /api/categories` listing and prevents it from showing up in public event searches, but preserves all historical foreign-key relations to past events heavily tied to it.

### Status of Planned Endpoints
- [x] `GET /api/categories` (Implemented)
- [x] `GET /api/categories/{id}` (Implemented)
- [x] `POST /api/categories` (Implemented)
- [x] `PUT /api/categories/{id}` (Implemented)
- [x] `PATCH /api/categories/{id}/status` (Implemented)

---

## 5. Venues

### Logic Details

**`GET /api/venues`**
*   **Purpose:** Retrieve a list of physical event venues.
*   **Access:** Public.
*   **Business Logic:** Fetches a list of physical locations. Includes filtering capabilities (e.g., `?city=`). Like categories, the query strictly projects only `ACTIVE` venues to the public.

**`GET /api/venues/{id}`**
*   **Purpose:** Fetch specific venue details.
*   **Access:** Public.
*   **Business Logic:** Bypasses status filters. Returns complex entity data including the venue's master capacity constraints regardless of the venue's active/inactive status.

**`POST /api/venues`**
*   **Purpose:** Define a new venue in the system.
*   **Access:** Admin Only.
*   **Business Logic:** Registers physical attributes, addresses, and crucially, an absolute numeric `capacity`. This capacity is tracked and utilized strictly by downstream logic to validate whether event ticket tier limits exceed the venue limit.

**`PUT /api/venues/{id}`**
*   **Purpose:** Update physical venue characteristics.
*   **Access:** Admin Only.
*   **Business Logic:** Edits attributes including the capacity.

**`PATCH /api/venues/{id}/status`**
*   **Purpose:** Alter venue usability status.
*   **Access:** Admin Only.
*   **Business Logic:** Toggling to `INACTIVE` invokes constraints that immediately prevent any *new* draft events from being logically scheduled at this location and purges the venue from the public filtering list.

### Mismatches vs. Design
- `POST /api/venues/{id}/images` — **Not implemented**.
- `DELETE /api/venues/{id}/images/{mediaId}` — **Not implemented**.

### Status of Planned Endpoints
- [x] `GET /api/venues` (Implemented)
- [x] `GET /api/venues/{id}` (Implemented)
- [x] `POST /api/venues` (Implemented)
- [x] `PUT /api/venues/{id}` (Implemented)
- [x] `PATCH /api/venues/{id}/status` (Implemented)
- [ ] `POST /api/venues/{id}/images` (**NOT IMPLEMENTED**)
- [ ] `DELETE /api/venues/{id}/images/{mediaId}` (**NOT IMPLEMENTED**)

---

## 6. Events

### Logic Details

**`POST /api/events`**
*   **Purpose:** Create a new event listing.
*   **Access:** Organizer.
*   **Business Logic:** Ingests base event details (Time, Venue, Category). Always initializes the core state machine to `DRAFT`. Validates the chosen venue and category are intrinsically active and valid.

**`GET /api/events`**
*   **Purpose:** Main search and discovery endpoint for events.
*   **Access:** Public / Organizer / Admin.
*   **Business Logic:** Highly contextual endpoint implementing complex Role-Based Filter Strategies:
    *   **PUBLIC Context:** Query rigorously filters to show ONLY events in `PUBLISHED` state, where the `startTime` is structurally in the future, the linked category is `ACTIVE`, and the linked venue is `ACTIVE`.
    *   **ORGANIZER Context:** Overrides public filters. Securely query-binds to the Organizer's ID and strips away the publication restrictions; returning their own events across all lifecycle statuses (`DRAFT`, `PENDING`, `CANCELLED`). Respects explicit `?status=` parameters.
    *   **ADMIN Context:** Complete bypass on visibility restrictions. Returns all events globally, allowing explicit system filtering rules via HTTP params.
    *   **Filters Handled:** `search`, `categoryId`, `city`, `venueId`, `date` (exact `YYYY-MM-DD` match), `minPrice`, `maxPrice`, `sort`, `page`, `size`.

**`GET /api/events/{id}`**
*   **Purpose:** Fetch highly detailed configuration of an event.
*   **Access:** Public / Organizer / Admin.
*   **Business Logic:** Executes intense contextual visibility rules:
    *   **PUBLIC Context:** Triggers a `404 Not Found` if the requested event is not explicitly `PUBLISHED`, if the event has structurally concluded (past event), or if the dependencies (venue/category) are disabled.
    *   **ORGANIZER Context:** Grants access if the caller is the exact owner. Triggers a `403 Forbidden` if attempting to view a sibling organizer's `DRAFT` or private event.
    *   **ADMIN Context:** Grants universal read access.

**`PUT /api/events/{id}`**
*   **Purpose:** Modify event details and configuration.
*   **Access:** Organizer / Admin.
*   **Business Logic:** Strictly guards event modification based on State Lifecycle. Only allows modification operations mapping to metadata updates if the Event is specifically in `DRAFT` or `APPROVED` states. **Rejects updates entirely** if the Event is currently `PUBLISHED` (live). Performs deep validation to ensure that the aggregate total of ticket quantities defined for the event structurally matches the stated event capacity.

**`DELETE /api/events/{id}`**
*   **Purpose:** Remove an event.
*   **Access:** Organizer / Admin.
*   **Business Logic:** Standard entity removal.

**`PATCH /api/events/{id}/status`**
*   **Purpose:** Manages the strict state machine of Event Lifecycles.
*   **Access:** Organizer / Admin.
*   **Business Logic:** Validates allowed transition vectors based on Caller Role:
    *   **DRAFT -> PENDING APPROVAL:** Organizer submitting for review.
    *   **PENDING APPROVAL -> APPROVED:** Admin verifying the event.
    *   **APPROVED -> PUBLISHED:** Making it live.
    *   **ANY -> CANCELLED:** Organizer or Admin terminating operations. Organizer strictly cannot cancel an event once it reaches the `PUBLISHED` phase (only an admin intervention can).

### Mismatches vs. Design
- `?date=` parameter — Design listed `?date=` (single date). Previous implementation used `?fromDate=` / `?toDate=`. Now corrected to `?date=`.
- `?minPrice=` / `?maxPrice=` — Were missing from the previous implementation. Now implemented.
- `POST /api/events/{id}/images` — **Not implemented**.
- `DELETE /api/events/{id}/images/{mediaId}` — **Not implemented**.
- `PUT /api/events/{id}/images/{mediaId}/primary` — **Not implemented**.

### Status of Planned Endpoints
- [x] `GET /api/events` (Implemented — role-based filtering enforced)
- [x] `POST /api/events` (Implemented)
- [x] `GET /api/events/{id}` (Implemented — role-based access control enforced)
- [x] `PUT /api/events/{id}` (Implemented)
- [x] `DELETE /api/events/{id}` (Implemented)
- [x] `PATCH /api/events/{id}/status` (Implemented)
- [ ] `POST /api/events/{id}/images` (**NOT IMPLEMENTED**)
- [ ] `DELETE /api/events/{id}/images/{mediaId}` (**NOT IMPLEMENTED**)
- [ ] `PUT /api/events/{id}/images/{mediaId}/primary` (**NOT IMPLEMENTED**)

---

## 7. Tickets

### Logic Details

**`POST /api/events/{eventId}/tickets`**
*   **Purpose:** Define ticket pricing tiers and inventories.
*   **Access:** Organizer.
*   **Business Logic:** Tied rigidly to the parent Event. Ensures that the requested capacity alterations mathematically adhere to the venue constraints. The application restricts updating the pricing array and base quantities strictly to phases *before* any live public sales/bookings have commenced. 

**`GET /api/events/{eventId}/tickets`**
*   **Purpose:** Fetch ticket lists and current inventory levels.
*   **Access:** Public / Organizer.
*   **Business Logic:** Tracks and returns `available_quantity` in real-time. Public context queries logically filter out dead/inactive tickets, returning strictly `ACTIVE` ticket configurations. Organizer contexts strip filters to visualize disabled ticket structures as well.

**`PUT /api/tickets/{id}`**
*   **Purpose:** Modify ticket semantics & rules.
*   **Access:** Organizer.
*   **Business Logic:** Enforces update restrictions if active bookings exist against the tier. 

**`PATCH /api/tickets/{id}/status`**
*   **Purpose:** Turn ticketing tracks on and off.
*   **Access:** Organizer.
*   **Business Logic:** Switches usability to `INACTIVE`, abruptly terminating public access to purchase this specific tier.

### Status of Planned Endpoints
- [x] `GET /api/events/{eventId}/tickets` (Implemented)
- [x] `POST /api/events/{eventId}/tickets` (Implemented)
- [x] `PUT /api/tickets/{id}` (Implemented)
- [x] `PATCH /api/tickets/{id}/status` (Implemented)

---

## 8. Offers & Discounts

### Logic Details

**`POST /api/events/{eventId}/offers`**
*   **Purpose:** Attach promotional mechanisms.
*   **Access:** Organizer (self-events) / Admin.
*   **Business Logic:** Creates discount logic. Enforces constraints ensuring Organizers can only map offers to Event IDs they natively own. Admins circumvent this rule globally.

**`GET /api/events/{eventId}/offers`**
*   **Purpose:** List available promotional rules.
*   **Access:** Organizer / Admin.
*   **Business Logic:** Administrative fetching. 

**`PUT /api/offers/{id}`**
*   **Purpose:** Update promotional parameters.
*   **Access:** Organizer / Admin.
*   **Business Logic:** Updates validity and structural usage limits.

**`PATCH /api/offers/{id}/status`**
*   **Purpose:** Deactivate or activate an offer instantly.
*   **Access:** Organizer / Admin.
*   **Business Logic:** Flags offer row usability.

**`POST /api/offers/validate`**
*   **Purpose:** Engine to execute promo codes against a purchase cart.
*   **Access:** Authenticated Attendee.
*   **Business Logic:** Performs deep algorithmic validation. Checks the submitted code identifier (handling it case-insensitively). Compares system time against validity start/end boundaries. Confirms aggregate usage bounds haven't been breached. Executes mathematical calculations applying the specific stated percentage discount strictly capped mathematically at an absolute `max_discount_amount`. Returns the calculated financial diff for display.

### Status of Planned Endpoints
- [x] `GET /api/events/{eventId}/offers` (Implemented)
- [x] `POST /api/events/{eventId}/offers` (Implemented)
- [x] `PUT /api/offers/{id}` (Implemented)
- [x] `PATCH /api/offers/{id}/status` (Implemented)
- [x] `POST /api/offers/validate` (Implemented)

---

## 9. Bookings

### Logic Details

**`POST /api/bookings/preview`**
*   **Purpose:** Dry-run cart calculator.
*   **Access:** Authenticated Attendee.
*   **Business Logic:** Ingests desired tickets and promo codes. Executes the entire financial calculation (applying underlying `validate` functions and unit prices) without physically side-effecting or persisting database transaction states. Returns the projected invoice wrapper to the UI checkout.

**`POST /api/bookings`**
*   **Purpose:** Execute and manifest a formal booking.
*   **Access:** Authenticated Attendee.
*   **Business Logic:** Critical transactional flow containing multiple steps:
    1. Instantiates a core registration row flagged structurally as `PENDING`.
    2. Atomically decrements the target ticket Tier's physical database inventory levels to hold the assets temporarily.
    3. Interfaces via Network HTTP call to generate an official Razorpay Order ID.
    4. Persists an adjacent `PENDING` payment verification record connected mathematically to the Order ID.
    5. Returns gateways constraints to the frontend for client-side payment completion.

**`GET /api/bookings`**
*   **Purpose:** List a user's chronological booking history.
*   **Access:** Authenticated Attendee.
*   **Business Logic:** Returns the current principal's history of requested attendances. 

**`GET /api/bookings/{id}`**
*   **Purpose:** Fetch specific booking invoice and states.
*   **Access:** Owner User.
*   **Business Logic:** Retrieves the unified Registration -> Participant -> Payment record cluster.

**`PATCH /api/bookings/{id}/status`**
*   **Purpose:** Cancel or modify a booking state.
*   **Access:** Attendee.
*   **Business Logic:** Highly rigid cancellation path. An Attendee can only execute a cancellation command if the backend validates sequentially that:
    1. The booking is actively in `CONFIRMED` status.
    2. The underlying Event configuration is explicitly flagged as 'cancellable'.
    3. The absolute system time precedes the specific Event's `cancellation_deadline`.
    Upon validation, the backend reverses the transactional flow—atomically restoring the inventory back to the ticket tier pools and generating pending refund logs.

**`GET /api/bookings/{bookingId}/refunds`**
*   **Purpose:** Check status of refund batches initiated during a booking cancellation.
*   **Access:** Attendee / Admin.
*   **Business Logic:** Returns granular financial trace data regarding returned fund requests linked to the user's booking ID.

### Status of Planned Endpoints
- [x] `POST /api/bookings/preview` (Implemented)
- [x] `POST /api/bookings` (Implemented)
- [x] `GET /api/bookings` (Implemented)
- [x] `GET /api/bookings/{id}` (Implemented)
- [x] `PATCH /api/bookings/{id}/status` (Implemented)
- [x] `GET /api/bookings/{bookingId}/refunds` (Implemented)

---

## 10. Participants

### Logic Details

*(Participants reflect the individual physical humans bound to a given Booking Request)*

**`GET /api/events/{eventId}/participants`**
*   **Purpose:** Fetch the guest list for an entire event.
*   **Access:** Organizer / Admin.
*   **Business Logic:** Allows fetching attendees. Returns lists of participants filtered functionally strictly by `?status=` param logic (e.g. `CHECKED_IN`, `ACTIVE`, `CANCELLED`).

**`GET /api/events/{eventId}/participants/{id}`**
*   **Purpose:** View an individual delegate's entry ticket data.
*   **Access:** Organizer / Admin.
*   **Business Logic:** Details the specific human guest parameters.

**`PATCH /api/participants/{id}/status`**
*   **Purpose:** Manage real-time physical access/Gate Management and lifecycle.
*   **Access:** Organizer / Attendee.
*   **Business Logic:** Double-sided controller access.
    *   **Organizer context:** Usually executes state changes to mark attendees physically as `CHECKED_IN` at the door.
    *   **Attendee Context:** Can invoke a discrete state change to mark an individual ticket/slot as `CANCELLED`, structurally triggering fractional refund routing processes across backend services.

**`PUT /api/participants/{id}`**
*   **Purpose:** Edit delegate profile assignments post-booking.
*   **Access:** Attendee (Owner).
*   **Business Logic:** Facilitates guest name/phone modification processes. Enforces a harsh validation rule restricting any mutation attempt if the current system time supersedes the event's physical `startTime`.

**`POST /api/participants`**
*   **Purpose:** Explicitly save guest details for a booking.
*   **Access:** Attendee (Owner).
*   **Business Logic:** Supports bulk registration of guests linked to specific `registration_item_id`s and `event_id`s. Validates that the total number of participants created for a registration item does not exceed the quantity purchased in the booking. Automatically generates unique 12-character alphanumeric ticket codes for each participant.

### Mismatches vs. Design
- `GET /api/events/{eventId}/participants` — Design specifies `?search=` (name/email/phone/ticketCode) and `?ticketId=` filters. **Actual**: only `?status=` is supported.

### Status of Planned Endpoints
- [x] `GET /api/events/{eventId}/participants` (Implemented — `?search=` and `?ticketId=` filters missing)
- [x] `GET /api/events/{eventId}/participants/{id}` (Implemented)
- [x] `PATCH /api/participants/{id}/status` (Implemented)
- [x] `PUT /api/participants/{id}` (Implemented)
- [x] `POST /api/participants` (Implemented)

---

## 11. Event Registrations (Organizer / Admin View)

### Logic Details

**`GET /api/events/{eventId}/registrations`**
**`GET /api/events/{eventId}/registrations/{id}`**
*   **Purpose:** Aggregate financial and booking grouping requests mapped to an event node.
*   **Access:** Organizer / Admin.
*   **Business Logic:** Distinct from "Participants" (which refers to individual humans). Registers the holistic summary scope (the purchase blocks) mapped over an entire event. Extensively leveraged dynamically by Organizers for complex offline reconciliation of total projected sales offsets and accounting blocks.

### Status of Planned Endpoints
- [x] `GET /api/events/{eventId}/registrations` (Implemented)
- [x] `GET /api/events/{eventId}/registrations/{id}` (Implemented)

---

## 12. Payments

### Logic Details

**`POST /api/payments/verify`**
*   **Purpose:** Formally ingest gateway callback arrays and finalize transactions.
*   **Access:** Authenticated Attendee (Client-side verification).
*   **Business Logic:** Most cryptographically critical system operation. Executes mathematical HMAC-SHA256 signature verification validating the incoming hash against structural local secrets to ensure raw transactional data integrity originated officially from the Gateway provider. Upon verifiable success:
    1. Updates the attached parent Booking Registration block rigidly to `CONFIRMED`.
    2. Spawns iterative Participant entity rows mapping to physical human attendees effectively executing the tickets.

**`POST /api/payments/fail`**
*   **Purpose:** Capture aborted interactions.
*   **Access:** Authenticated Attendee.
*   **Business Logic:** Transitions payment logs to `FAILED` retaining session references.

**`POST /api/payments/retry`**
*   **Purpose:** Recover broken transactional chains.
*   **Access:** Attendee.
*   **Business Logic:** Detects an invalid session, dynamically tearing down the dead references and executing a network call to assemble an entirely fresh Gateway Order Session ID, returning it to resume user checkout.

**`GET /api/payments`**  &  **`GET /api/payments/{bookingId}`**
*   **Purpose:** Payment audit trails.
*   **Access:** Admin (`GET /api/payments`) / Owner.
*   **Business Logic:** Exposes global log databases for Admins (filterable cleanly utilizing `?status=`).

### Mismatches vs. Design
- `POST /api/payments/webhook` — Service logic exists but **controller endpoint mapping is missing**.
- `GET /api/payments` — `?eventId=`, `?from=`, `?to=` filters specified in design are **not implemented**.

### Status of Planned Endpoints
- [x] `POST /api/payments/verify` (Implemented)
- [x] `POST /api/payments/fail` (Implemented)
- [x] `POST /api/payments/retry` (Implemented)
- [ ] `POST /api/payments/webhook` (**NOT IMPLEMENTED** — service logic exists, controller mapping missing)
- [x] `GET /api/payments/{bookingId}` (Implemented)
- [x] `GET /api/payments` (Implemented — `?eventId=`, `?from=`, `?to=` filters missing)

---

## 13. Refunds

### Logic Details

**`GET /api/events/{eventId}/refunds`**
**`GET /api/refunds`**
*   **Purpose:** Aggregate lists of structural return requests.
*   **Access:** Organizer (`/events`) / Admin (global list).
*   **Business Logic:** Queries the refund tracking subsystem, mapping statuses such as `PENDING`, `SUCCESS`, and `FAILED` tied logically to the target event entity parameters.

**`POST /api/refunds/{id}/retry`**
*   **Purpose:** Administrative recovery of physically broken return transfers.
*   **Access:** Admin.
*   **Business Logic:** Validates the target refund's active State constraint. Strictly permits retry execution attempts *only* if the underlying entity state evaluates exactly to `FAILED`.

### Mismatches vs. Design
- `GET /api/refunds` — `?eventId=`, `?from=`, `?to=` filters specified in design are **not implemented**.

### Status of Planned Endpoints
- [x] `GET /api/events/{eventId}/refunds` (Implemented)
- [x] `GET /api/refunds` (Implemented — `?eventId=`, `?from=`, `?to=` filters missing)
- [x] `POST /api/refunds/{id}/retry` (Implemented)

---

## 14. Feedback

### Logic Details

**`POST /api/events/{eventId}/feedbacks`**
*   **Purpose:** Submit post-event qualitative text and scoring.
*   **Access:** Attendee.
*   **Business Logic:** Evaluates deep contextual legitimacy checks. Specifically queries system state to guarantee the calling user structurally possesses a true, executed attendance record, and verifies the target Event lifecycle state reads distinctly as `COMPLETED`. Implements strict constraint checks blocking duplicate submissions originating from the identical user-event intersection.

**`GET /api/events/{eventId}/feedbacks`**
*   **Purpose:** Display user testimony logic.
*   **Access:** Public / Organizer / Admin.
*   **Business Logic:** Moderation-aware aggregation list. Supports filtering by `?rating=` and `?status=`. Public visibility queries algorithmically append a constraint restricting output exclusively to feedback explicitly marked `VISIBLE`. Organizers and Admins are granted elevated visibility bypasses retrieving `FLAGGED` structural properties as well.

**`PUT /api/feedbacks/{id}`**
*   **Purpose:** Modify testimony context.
*   **Access:** Attendee (Owner).
*   **Business Logic:** Incorporates a time-based decay lock restricting mutation capabilities exclusively to a 7-day chronological window originating post initial submission vector creation.

**`DELETE /api/feedbacks/{id}`**
*   **Purpose:** Destroy a feedback record.
*   **Access:** Attendee (Owner) / Admin.
*   **Business Logic:** Standard row elimination.

**`PATCH /api/feedbacks/{id}/status`**
*   **Purpose:** Administrative moderation execution.
*   **Access:** Admin Only.
*   **Business Logic:** Facilitates explicit censorship workflow toggling the structural parameter between `VISIBLE` and `FLAGGED` modifying public consumption access.

### Status of Planned Endpoints
- [x] `POST /api/events/{eventId}/feedbacks` (Implemented)
- [x] `GET /api/events/{eventId}/feedbacks` (Implemented)
- [x] `PUT /api/feedbacks/{id}` (Implemented)
- [x] `DELETE /api/feedbacks/{id}` (Implemented)
- [x] `PATCH /api/feedbacks/{id}/status` (Implemented)

---

## 15. Notifications

### Logic Details

**`GET /api/notifications`**  &  **`GET /api/notifications/unread-count`**
*   **Purpose:** Retrieve inbox signals.
*   **Access:** Any Authenticated User.
*   **Business Logic:** Returns chronological structural payload lists and executes real-time count queries evaluating the explicit backend `read = false` flag attached dynamically to the requesting user session.

**`PATCH /notifications/{id}/status`**
*   **Purpose:** Update read states.
*   **Access:** Authenticated User.
*   **Business Logic:** Mutates the target notification row toggling the integer/boolean structure representing visual read logic.

**`POST /api/notifications/read-all`**
*   **Purpose:** Bulk engagement modifier.
*   **Access:** Authenticated User.
*   **Business Logic:** Efficient database update executing a mass mutation marking every attached `unread` signal owned by the principal parameter to the `read` designation simultaneously.

**`POST /api/events/{eventId}/notifications`**
*   **Purpose:** Targeted Event Announcement broadcast stream execution.
*   **Access:** Organizer.
*   **Business Logic:** Maps to specific parent Events. The backend algorithm iterates entirely through the list mapping the physical event to all structurally `CONFIRMED` physical attendees, dynamically spawning individualized notification signals per user ID executing the query.

**`POST /api/notifications/broadcast`**
*   **Purpose:** Master level system messaging deployment platform.
*   **Access:** Admin Only.
*   **Business Logic:** Exposes internal system messaging architecture. Executes routing loops targeting entire database roles (e.g., all `ORGANIZERS`) or blasting message arrays.

### Mismatches vs. Design
- `PATCH /notifications/{id}/status` — Design path is missing the `/api` prefix and is listed inconsistently. **Actual path**: `PATCH /notifications/{id}/status` (matches the controller mapping).
- `GET /api/notifications/broadcast-history` — Implemented but missing from original design.

### Status of Planned Endpoints
- [x] `GET /api/notifications` (Implemented)
- [x] `GET /api/notifications/unread-count` (Implemented)
- [x] `PATCH /notifications/{id}/status` (Implemented)
- [x] `POST /api/notifications/read-all` (Implemented)
- [x] `POST /api/events/{eventId}/notifications` (Implemented)
- [x] `POST /api/notifications/broadcast` (Implemented)
- [x] `GET /api/notifications/broadcast-history` (Implemented)

---

## 16. Reports (Organizer / Admin)

### Logic Details

**`GET /api/reports/summary`**
*   **Purpose:** High-level dashboard stats.
*   **Access:** Organizer / Admin.
*   **Business Logic:** Returns counts of total events, bookings, and revenue. Organizers see their own data; Admins see system-wide stats.

**`GET /api/reports/revenue`**
*   **Purpose:** Financial trend reporting.
*   **Access:** Organizer / Admin.
*   **Business Logic:** Returns time-series revenue data. Supports `?from=`, `?to=`, and `?groupBy=` (day/month/year) for granular chart plotting.

**`GET /api/reports/events`**
*   **Purpose:** Performance overview of all events.
*   **Access:** Organizer / Admin.
*   **Business Logic:** Paginated list of events with key performance indicators (KPIs) like fill percentage and revenue per event.

**`GET /api/reports/events/{eventId}`**
*   **Purpose:** Deep dive into a specific event's performance.
*   **Access:** Organizer / Admin.
*   **Business Logic:** Detailed metrics for a single event, including ticket sales breakdown and attendee demographics summaries.

**`GET /api/reports/events/{eventId}/tickets`**
*   **Purpose:** Inventory and sales velocity by ticket tier.
*   **Access:** Organizer / Admin.
*   **Business Logic:** Granular report on how each ticket category (Early Bird, VIP, etc.) is performing for a specific event.

**`GET /api/reports/events/{eventId}/revenue`**
*   **Purpose:** Financial reconciliation for a specific event.
*   **Access:** Organizer / Admin.
*   **Business Logic:** Detailed revenue breakdown, including discounts applied and net sales.

**`GET /api/reports/organizers`**
*   **Purpose:** Administrative benchmarking of organizer performance.
*   **Access:** Admin Only.
*   **Business Logic:** Comparison report showing which organizers are driving the most volume and revenue.

### Status of Planned Endpoints
- [x] `GET /api/reports/summary` (Implemented)
- [x] `GET /api/reports/revenue` (Implemented)
- [x] `GET /api/reports/events` (Implemented)
- [x] `GET /api/reports/events/{eventId}` (Implemented)
- [x] `GET /api/reports/events/{eventId}/tickets` (Implemented)
- [x] `GET /api/reports/events/{eventId}/revenue` (Implemented)
- [x] `GET /api/reports/organizers` (Implemented)

---

## 17. Media Management

### Status of Planned Endpoints
- [ ] `POST /api/media` (**NOT IMPLEMENTED**)
- [ ] `DELETE /api/media/{id}` (**NOT IMPLEMENTED**)