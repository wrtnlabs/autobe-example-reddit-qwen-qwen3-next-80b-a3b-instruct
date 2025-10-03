## User Journey: Explore and Join Communities

### User Persona

A user who is new to the platform or has not yet found communities to join. They are interested in discovering and participating in topic-based sub-communities. This user may be:
- A guest (unauthenticated) browsing content to evaluate the platform
- A member who has joined a few communities but is seeking new ones
- An infrequent user returning after inactivity and looking to re-engage

This user is motivated by curiosity, shared interests, and desire to participate in relevant discussions. They do not know which communities exist or which are active; they rely on the platform to surface relevant communities effectively.

### Goal Statement

The user wants to discover new sub-communities based on their interests, explore community content and rules, and join one or more communities to customize their home feed and participate in discussions.

### Pre-conditions

- The user has navigated to the /c route (Explore sub-communities page)
- The user's session state is either authenticated (member) or unauthenticated (guest)
- The system has loaded the full list of available sub-communities, categorized by the predefined list: [Tech & Programming] [Science] [Movies & TV] [Games] [Sports] [Lifestyle & Wellness] [Study & Education] [Art & Design] [Business & Finance] [News & Current Affairs]
- The left sidebar displays the fixed navigation: Home / Explore / Create buttons and up to 5 Recent Communities entries
- The right sidebar is not used on this page
- The global navbar shows the logo, search input, Create (post) button, and Profile dropdown

### Main Success Scenario (Authenticated User)

WHEN a member user navigates to the Explore page (/c), THE system SHALL display:

1. A horizontal row of category chips, exactly in this order: [Tech & Programming] [Science] [Movies & TV] [Games] [Sports] [Lifestyle & Wellness] [Study & Education] [Art & Design] [Business & Finance] [News & Current Affairs]
2. A grid of 20 community cards, sorted alphabetically by community name, showing only communities that have been created
3. Each community card shall display:
   - Top: Community logo (if available; otherwise a default icon)
   - Community name (as registered)
   - Member count (rounded and abbreviated: 1,000 → 1k, 10,000 → 12k, 1,000,000 → 1.2m)
   - A join button with default text "Join"
4. The member count appears directly below the community name
5. The "Join" button is a primary actionable element in the bottom-right corner of the card
6. Each category chip is clickable and has no initial selection state

WHEN the user clicks a category chip, THE system SHALL:

1. Immediately hide all community cards that do not belong to the selected category
2. Immediately show only community cards belonging to the selected category
3. Apply visual highlight (e.g., filled background) to the clicked category chip
4. Preserve existing scroll position within the grid

WHEN the user clicks the "Join" button on a community card, THE system SHALL:

1. Immediately change button text from "Join" to "Joined"
2. Immediately update the Recent Communities list in the left sidebar:
   a. If the community is not already in the list, add it as the first item
   b. If the community is already in the list, move it to the first position
   c. If the list already contains 5 communities and a new one is added, remove the last (oldest) entry
3. Immediately add posts from this newly joined community to the user’s home feed (next time they navigate to /)
4. Do not remove the community from the Explore grid - it remains visible but with "Joined" state

WHILE the user is viewing the Explore page, THE system SHALL:

1. Allow infinite scrolling with "[Load more]" button at bottom
2. Load additional 20 community cards when "[Load more]" is clicked
3. Preserve category filter during new loads
4. Maintain joined state visibility ("Joined" button) in newly loaded cards

WHEN the user clicks "[Load more]" in an active category filter, THE system SHALL:

1. Fetch the next 20 communities belonging to the selected category
2. Append them to the bottom of the existing grid
3. Maintain the "Joined" state for any community the user has already joined

WHEN a user clicks on a community name in a card, THE system SHALL navigate to the community’s home page at /c/[name].

WHEN the user clicks the "Joined" button on a community card, THE system SHALL:

1. Immediately change button text from "Joined" to "Join"
2. Immediately remove this community from the Recent Communities list if it was present
3. Immediately exclude all posts from this community from the user’s Home feed

WHILE a user has active category filtering, THE system SHALL:

1. Retain the applied category filter state during any navigation away and back
2. Preserve "Joined" button states for all communities that have been joined
3. Update pagination counter if user changes filters (e.g., "Showing 8 of 120 communities")

WHERE a community has no description, THE system SHALL display an empty description field in the community card.

WHERE a community has no logo, THE system SHALL display a default placeholder icon in the card.

### Main Success Scenario (Guest User)

WHEN a guest user navigates to the Explore page (/c), THE system SHALL:

1. Display all category chips in the fixed alphabetical order
2. Display 20 community cards exactly as described in the authenticated user scenario
3. Display button text as "Join" for all communities
4. Disable all interactive behaviors of the "Join" button (no mouse hover effect, no click response)
5. Show a prominent overlay or banner above the community grid with message: "Please sign in to continue. Join communities to customize your feed."
6. Display an outline (non-filled) "Join" button with cursor set to "not-allowed"

WHEN a guest user clicks the "Join" button on any community, THE system SHALL:

1. Prevent any UI state change on the Explore page
2. Immediately display a login modal overlay (without navigation or URL change)
3. Preserve the scroll position and category filter state
4. After successful login, automatically return to the Explore page at the same scroll position and category filter
5. Immediately update the clicked button from "Join" to "Joined" in the UI
6. Immediately add the community to the Recent Communities list in the left sidebar

WHEN the user attempts to click a community name while logged out, THE system SHALL:

1. Navigate to the community page (/c/[name]) as if clicked
2. Immediately interrupt with login modal overlay
3. After successful login, redirect to the exact community page (/c/[name])

### Alternative Scenarios

IF a user has joined more than 100 communities, THEN THE system SHALL still show all filtered communities in the Explore grid with correct "Joined" state.

IF a community has been deleted by an admin, THEN THE system SHALL: 

1. Never display the deleted community in any Explore grid
2. If the user has previously joined it, remove it silently from Recent Communities list and from their Home feed
3. Do not show any error message or broken link

IF there are no communities in a selected category, THEN THE system SHALL:

1. Display a single card in the grid with message: "No communities found in this category."
2. Keep the category chip highlighted
3. Disable "[Load more]" button

IF the user has joined 5 or more communities, THEN THE system SHALL:

1. Maintain only the 5 most recently joined communities in the Recent Communities list
2. Order by most recent activity (join date/time), descending
3. If two communities were joined at the same time, prioritize by community creation date (older first)

IF a community name changes due to system administrative action, THEN THE system SHALL:

1. Ensure the Explore page reflects the new community name
2. Update any links from Recent Communities list to point to the new name
3. Do not break joined state; membership remains active

IF the user logs out while on the Explore page, THEN THE system SHALL:

1. Clear the Recent Communities list
2. Keep category filter setting for future login sessions
3. Reset all "Joined" buttons to "Join" state

IF the user performs multiple rapid clicks on the "Join" button before response, THEN THE system SHALL:

1. Disable the button temporarily after first click
2. Re-enable after server response or 2 seconds
3. Guarantee that the final state matches server state (idempotent behavior)

IF the server returns error while updating join state, THEN THE system SHALL:

1. Restore the button to its previous state (Join ↔ Joined)
2. Do not remove the community from Recent Communities list
3. Show a transient (auto-hiding) banner: "A temporary error occurred. Please try again in a moment."

IF the user searches for communities via global search bar while on /c, THEN THE system SHALL:

1. Redirect to /s with pre-filled category selection filter
2. Auto-switch to the Sub-Communities tab in search results
3. Apply the same term and preserve context

### Post-action Outcomes

After successfully joining a community:

- The community appears in the Recent Communities list (up to 5)
- The "Join" button on the Explore page changes to "Joined"
- The user's Home feed will now include this community's posts when sorted
- In future sessions, the community remains in Recent Communities list until replaced by more recent activity
- If the user joins a community, then leaves it, then rejoins, it resets to top of Recent Communities list

After clicking a community name in Explore:

- The user is taken to /c/[name]
- The left sidebar maintains the same Recent Communities list
- The right sidebar now shows: Community Info + Rules (as specified in the requirements)
- The "Join" button in the community header reflects joined status

After leaving a community:

- The community disappears from Recent Communities list
- Posts from this community are excluded from the user's Home feed
- The Explore page updates the button to "Join" immediately

## Diagram: Community Explore and Join Flow

```mermaid
graph LR
    A[Start: User on /c] --> B[Display 10 Category Chips]
    B --> C[Display 20 Community Cards: Logo, Name, Member Count, Join Button]
    C --> D{User clicks Category Chip?}
    D -->|Yes| E[Filter Grid by Category]
    E --> F[Show only communities in category]
    F --> C
    D -->|No| G{User clicks "Join" button?}
    G -->|Yes| H[Check Auth State]
    H -->|Guest| I[Show Login Modal Overlay]
    I --> J{Login Successful?}
    J -->|Yes| K[Update Button: "Join" → "Joined"]
    J -->|No| I
    H -->|Member| K
    K --> L[Update Recent Communities List: Add Community First]
    L --> M[Add Community to User's Home Feed (next visit)]
    G -->|No| N{User clicks Community Name?}
    N -->|Yes| O[Redirect to /c/[name]]
    N -->|No| P{User clicks "[Load more]"?}
    P -->|Yes| Q[Fetch Next 20 Communities]
    Q --> R[Append to Grid, preserve filter and Join state]
    R --> C
    P -->|No| S[Idle: Wait for interaction]
    S --> A
```

> *Developer Note: This document defines **business requirements only**. All technical implementations (architecture, APIs, database design, etc.) are at the discretion of the development team.