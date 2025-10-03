## User Journey: Create Community

### User Persona

The primary user persona for this journey is the **Initiator Member** — an authenticated user who is actively seeking to establish a new topic-based sub-community on the platform. This user is typically passionate about a specific subject, has identified a gap in existing communities, and desires a dedicated space for like-minded individuals to share and discuss. They are not necessarily an administrator or moderator, but they act as the initial steward of this new community. They act on a desire for cultural contribution, not technical control — they expect the platform to guide them through setup intuitively.

### Goal Statement

The user aims to create a new sub-community with a unique name, background description, optional rules, and a representative visual identity (logo or banner). They want to complete this process in a frictionless, single-session flow, with instant feedback on failures (e.g., duplicate names) and immediate navigation to the newly created community home page. Their deeper goal is to establish a meaningful space where others can join, post, and engage — transforming from a passive observer into an active community builder.

### Pre-conditions

WHEN a user intends to create a community, THE system SHALL ensure the following pre-conditions are met:

- THE user SHALL be logged in as a **member** (not authenticated as guest or admin-only)
- THE user SHALL have no previously created community with the exact same name (even if deleted)
- THE user SHALL be on a page where the "Create" button is available — typically on Home or Explore
- THE user SHALL have a valid, active session (not expired)
- THE system SHALL be running the current software version
- WHEN the user has been identified as a member, THE system SHALL enable the Create Community button

### Main Success Scenario

WHEN a member user initiates community creation, THE system SHALL execute the following process:

1. THE user SHALL click the "Create" button in the left sidebar or top navbar
2. THE system SHALL navigate the user to "/c/create" page
3. THE system SHALL render a form with the following fields in order:
   - [Name]: Text input, mandatory
   - [Description]: Text area, optional
   - [Logo]: File upload input, optional
   - [Banner]: File upload input, optional
   - [Rules]: Text area (up to 5 rules), optional
   - [Category]: Single-select dropdown, mandatory — options are: ["Tech & Programming", "Science", "Movies & TV", "Games", "Sports", "Lifestyle & Wellness", "Study & Education", "Art & Design", "Business & Finance", "News & Current Affairs"]
   - [Create Community]: Submit button
4. THE user SHALL type or paste the desired community name
5. THE system SHALL dynamically validate the community name in real time as the user types
   - WHEN the name is empty, THE system SHALL show placeholder text: "A short, readable name for your community"
   - WHEN the name contains characters other than alphanumeric, hyphen (-), or underscore (_), THE system SHALL immediately display: "This name isn’t available. Please choose something simpler."
   - WHEN the name is 1–4 characters long, THE system SHALL show: "This name isn’t available. Please choose something simpler."
   - WHEN the name is 5+ characters and contains only allowed characters, THE system SHALL show: "Name is available"
   - WHEN the name is already taken by an existing community, THE system SHALL show: "This name is already in use."
6. THE user SHALL optionally upload a logo image (supports PNG, JPG, SVG; size limit: 2MB)
7. THE user SHALL optionally upload a banner image (supports PNG, JPG; size limit: 5MB)
8. THE user SHALL optionally enter community rules, each rule as a separate line:
   - THE system SHALL allow up to 10 lines (rules)
   - EACH rule SHALL be at most 120 characters
   - THE system SHALL NOT enforce numbering — the display will auto-number top 5 on community home
9. THE user SHALL select ONE category from the predefined dropdown list
10. THE user SHALL click "Create Community" button
11. THE system SHALL:
    - Accept the request and initiate background creation
    - Verify all required fields are populated (name and category)
    - Verify name is unique and valid
    - Validate file types and sizes
    - Store metadata in persistent storage (community name, description, creator ID, category, creation timestamp)
    - Store uploaded files (if any) with UUID-based identifiers and permanent URLs
    - Assign default placeholder logo or banner if upload was skipped
12. THE system SHALL immediately redirect the user to the newly created community’s home page at "/c/[name]"
13. THE system SHALL trigger the following observable updates
    - The user’s "Recent Communities" list in the left sidebar SHALL be updated to include the new community (as first item), trimmed to maximum 5 entries by recency
    - THE user SHALL automatically be marked as "Joined" the new community
    - THE user SHALL see their own posts appear in the main feed of the community page
14. THE system SHALL display the community home page with:
    - Logo and banner (if uploaded) or default images
    - "Joined" button styled as active
    - Community description
    - Community name in header
    - Category tag below name
    - Up to 20 latest posts (if any)
    - Sort toggle: [Newest] | [Top]
    - Post composer section visible

### Alternative Scenarios

#### A. Community Name Already Taken

WHEN a user inputs a community name that already exists in the system, THE system SHALL:

1. Immediately update the name field visual state to indicate error
2. Display the static message: "This name is already in use."
3. Keep the "Create Community" button disabled
4. Prevent the user from proceeding
5. When the user updates the name to something unique (valid format)
6. Hide the error message
7. Enable the "Create Community" button

#### B. User Submits with Missing Required Fields

WHEN a user clicks "Create Community" with:

- Empty community name, OR
- No category selected

THE system SHALL:

1. Not send the request to the backend
2. Display an inline alert: "Please enter a valid community name and select a category."
3. Visually highlight the focused field (e.g., red border)
4. Remain on the form for correction
5. Not navigate away from the page

#### C. Invalid Name Format

WHEN a user inputs a community name containing any of the following:

- Spaces
- Symbols: @, #, $, %, &, *, ?, <, >, |, \, /, ", ', ` 
- Unicode characters outside alphanumeric range
- Leading or trailing hyphens or underscores

THE system SHALL:

1. Display: "This name isn’t available. Please choose something simpler."
2. Keep the "Create Community" button disabled
3. Mark the field with visual error indicators
4. Prevent submission

#### D. Network Failure During Creation

WHILE a user clicks "Create Community" and the HTTP request fails, THE system SHALL:

1. Show: "A temporary error occurred. Please try again in a moment."
2. Keep the form visible with all entered data preserved
3. Allow the user to click "Create Community" again
4. Not redirect the user
5. Log the failure for debugging

#### E. Time-out / Session Expired During Creation

WHEN the user begins creation and the authentication token expires before submission, THE system SHALL:

1. Interrupt the operation
2. Display a modal login prompt
3. Return the user to the "/c/create" page with form data intact (name, description, rules)
4. Re-reference uploaded files from local storage if supported
5. Allow user to retry creation without re-entering

#### F. Uploading Large or Invalid Files

WHEN a user attempts to upload a logo file larger than 2MB or a banner larger than 5MB, THE system SHALL:

1. Immediately interrupt the file selection
2. Show: "File too large. Logo must be under 2MB. Banner must be under 5MB."

WHEN a user uploads a non-image file (e.g., PDF, ZIP) as logo/banner, THE system SHALL:

1. Show: "Invalid file type. Only images (JPG, PNG, SVG) are allowed."
2. Reset the file input
3. Allow the user to try again

#### G. User Leaves Page Before Creation

WHEN the user navigates away from "/c/create" before submitting (e.g., clicks browser back button), THE system SHALL:

1. Discard all form state
2. Not save any incomplete community draft
3. Not create a "pending" community
4. Not retain any trace of the uncompleted attempt in the database
5. Return the user to the previous page in the navigation history

### Post-action Outcomes

WHEN a community is created successfully, THE system SHALL guarantee the following outcomes:

- THE user SHALL be redirected to "/c/[name]" — the community’s home page
- THE user SHALL appear in the "Joined" state on the community page
- THE user SHALL be granted the ability to edit metadata (description, logo, banner, rules) — name remains immutable
- THE system SHALL register the user as the original creator (owner) of the community
- THE user’s "Recent Communities" list SHALL be updated with the new community added at the top
- THE new community SHALL appear in search results for its name
- THE community SHALL be visible in the Explore page under its selected category
- THE user SHALL be able to submit their first post immediately on the community page
- THE community SHALL inherit default permissions: no moderation, open posting, and membership-based feed inclusion
- THE system SHALL generate a community ID and assign it internally (unexposed to user)
- THE system SHALL create an audit entry: "Community [name] created by user [ID]"

### Associated Business Rules (Cross-Referenced)

- /* AUTO-REF 03-business-rules.md */ Community name SHALL be alphanumeric with hyphen (-) and underscore (_) only
- /* AUTO-REF 03-business-rules.md */ Community name SHALL be 5–64 characters long
- /* AUTO-REF 03-business-rules.md */ If logo or banner is missing, THE system SHALL use a default placeholder image
- /* AUTO-REF 03-business-rules.md */ Rules shall be stored internally as string array; only top 5 are shown on UI
- /* AUTO-REF 03-business-rules.md */ Category selection SHALL be enforced as one from the exact list provided
- /* AUTO-REF 01-user-roles.md */ Only users with "member" role SHALL be allowed to create communities
- /* AUTO-REF 01-user-roles.md */ Editor privileges for community metadata SHALL be limited to the creator
- /* AUTO-REF 02-functional-requirements.md */ Community name SHALL be unique — duplicates SHALL be rejected at the point of entry
- /* AUTO-REF 02-functional-requirements.md */ Community creation SHALL not require membership — it creates the community first

### System Behavior Summary

- The entire flow is designed to be **single-step, high-response, and immediately rewarding**
- The community is **created immediately** upon successful submission — no approval workflows
- The user’s transition from "creator" to "member" is **automatic and seamless**
- Validation is **front-end heavy** for UX, but **back-end enforced** for integrity
- Error recovery is **user-friendly** — form state is retained on input validation failures
- Session handling ensures **flow continuity even after re-login**
- No community data is stored persistently until the "Create" button is successfully clicked



## Diagram: Community Creation Flow

```mermaid
graph LR
    A[Start: User on "Create" page] --> B[Display Form]
    B --> C[User Types Community Name]
    C --> D{Valid Name?}
    D -->|No| E[Show Error: "This name isn't available" or "This name is already in use"]
    E --> C
    D -->|Yes| F[User Enters Description]
    F --> G[User Uploads Logo (Optional)]
    G --> H[User Uploads Banner (Optional)]
    H --> I[User Enters Rules (Optional)]
    I --> J[User Selects Category]
    J --> K[User Clicks "Create Community"]
    K --> L{All Required Fields?}
    L -->|No| M[Show Alert: "Please enter a valid community name and select a category"]
    M --> J
    L -->|Yes| N[Send Create Request to Backend]
    N --> O{Request Succeeds?}
    O -->|Yes| P[Redirect to /c/[name] instantly]
    O -->|No| Q[Show Error: "A temporary error occurred. Please try again in a moment."]
    Q --> C
    P --> R[Update Recent Communities List: Add New Community at Top]
    R --> S[Set User State to "Joined" for New Community]
    S --> T[Display Community Home Page with Logo, Banner, Rules, and Post Composer]
```


> *Developer Note: This document defines **business requirements only**. All technical implementations (architecture, APIs, database design, etc.) are at the discretion of the development team.