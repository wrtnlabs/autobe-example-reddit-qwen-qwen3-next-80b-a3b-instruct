## User Journey: Home Feed Experience

### User Persona

**New Visitor (Guest)**
A first-time user who arrives at the platform without an account. They are curious about community content, may be exploring similar platforms, and are not yet committed to joining. They have no preferences or history on the system.

**Returning Member (Authenticated)**
An existing user who has previously joined one or more sub-communities. They return regularly to engage with content from their selected communities, track discussions, and maintain active participation. They expect personalized, timely updates and smooth interaction flows.

### Goal Statement

Provide a seamless, personalized, and intuitive home feed experience that:
- Displays the most relevant content based on user membership status
- Enables effortless navigation between sorting modes
- Reinforces community discovery through the right sidebar
- Maintains continuous interaction state during login or session expiry
- Delivers immediate visual feedback on user actions

### Pre-conditions

- The user has navigated to `/` (Home page)
- The system has loaded the global layout (left sidebar, top navbar)
- The user’s authentication state is known (guest or member)
- The server has returned the initial set of posts for the UI (20 items)
- The right sidebar has loaded the latest 10 posts across all communities
- The sort control is initialized to "Newest"

### Main Success Scenario (Authenticated Member)

1. **Home Feed Initialization**
   - THE system SHALL display a list of 20 post cards from sub-communities the user has joined.
   - WHERE the user has joined at least one community, THE system SHALL exclude posts from communities they have not joined.
   
2. **Sorting Behavior**
   - WHEN the user selects "Newest" from the sort dropdown, THE system SHALL order posts by creation time descending (most recent first).
   - WHEN two or more posts have identical creation times, THE system SHALL prioritize the post with the higher numeric identifier (later-generated post).
   - WHEN the user selects "Top" from the sort dropdown, THE system SHALL order posts by score (upvotes minus downvotes) descending.
   - WHEN two or more posts have identical scores, THE system SHALL prioritize the post with the more recent creation time.
   - WHEN two or more posts have identical scores and identical creation times, THE system SHALL prioritize the post with the higher numeric identifier.

3. **Content Display**
   - THE system SHALL render each post card with:
     - Community name (e.g., "/c/ai") as a clickable link
     - Post title (truncated if exceeding display width)
     - Author display name (if set, otherwise "Anonymous")
     - Relative time stamp (e.g., "2 minutes ago", formatted to Seoul timezone)
     - Comment count (numeric value)
     - Score (calculated as upvotes minus downvotes, displayed as a number)
     - Upvote and downvote buttons (with current vote state indicated)

4. **Load More Interaction**
   - WHEN the user clicks "Load more", THE system SHALL fetch the next 20 posts matching the current sort order and membership filters.
   - THEN THE system SHALL append the new 20 posts to the bottom of the existing list without scrolling or reloading the page.

5. **Join/Leave Actions**
   - WHEN the user joins a new community from the "Explore" page or community header, THE system SHALL immediately add the latest posts from that community to the home feed.
   - WHEN the user leaves a community, THE system SHALL immediately remove all posts from that community from the home feed.
   - THEN THE system SHALL update the "Recent Communities" list in the left sidebar to include the newly joined (or removed) community, keeping the list to a maximum of 5 entries ordered by most recent interaction.

6. **Optimistic Updates**
   - WHEN the user upvotes or downvotes a post, THE system SHALL immediately update the vote button state and score in the UI.
   - THEN THE system SHALL send the vote to the server in the background.
   - IF the server response fails, THE system SHALL revert the UI state to its previous condition and display: "A temporary error occurred. Please try again in a moment."

7. **Session Expiry Handling**
   - IF the user’s session expires while interacting with the home feed, THE system SHALL show a non-intrusive banner: "Your session has expired. Please sign in to continue."
   - THEN THE system SHALL preserve the current sort, scroll position, and all pending actions (e.g., pending vote, comment draft).
   - WHEN the user completes re-login via modal, THE system SHALL automatically resume the previous state and execute any pending actions.

### Alternative Scenarios

#### Scenario 1: Guest User (Unauthenticated)

- WHEN a guest navigates to `/`, THE system SHALL display 20 of the most recent or highest-scoring posts from ALL communities (not filtered by membership).
- THEN THE system SHALL display a banner above the feed: "Welcome! Join communities to personalize your feed. Explore popular topics below."
- WHEN a guest attempts to upvote, downvote, comment, or post, THE system SHALL show a login prompt modal with message: "Please sign in to continue."
- WHEN the guest successfully logs in, THE system SHALL switch to the authenticated home feed experience, applying the appropriate membership filters.

#### Scenario 2: No Joined Communities

- WHEN a member has joined zero communities, THE system SHALL behave identically to the guest experience, showing global content.
- THEN THE system SHALL display a guidance message below the sort control: "You haven’t joined any communities yet. Visit Explore to find topics you love."
- WHEN the user joins their first community, THE system SHALL immediately filter the feed to include only posts from that community.

#### Scenario 3: Invalid Sort Selection

- IF the sort dropdown is programmatically set to an unrecognized value (e.g., due to a URL manipulation or bug), THE system SHALL default to "Newest".
- THEN THE system SHALL update the UI to reflect the default sort and log a warning to developer tools.

#### Scenario 4: Empty Feed

- WHEN a member has joined communities, but no posts exist in those communities, THE system SHALL display: "No posts yet in your communities. Be the first to share something!"
- THEN THE system SHALL display a "Create Post" button directly in the feed area.

#### Scenario 5: Right Sidebar Updates

- WHEN a new post is created in any community, THE system SHALL immediately append it to the top of the right sidebar’s "Global Latest" list (if not already present).
- WHEN the "Global Latest" list exceeds 10 items, THE system SHALL remove the oldest item to maintain the limit of 10.
- THE system SHALL never remove a post from the right sidebar if it is currently displayed in the main feed (even if older), to avoid inconsistency between views.

#### Scenario 6: Concurrent Feed Updates

- WHILE the user scrolls through the feed, THE system SHALL allow background polling or WebSocket updates to detect new posts in joined communities.
- IF a new post arrives that matches the current sort criteria, THE system SHALL insert it into the correct position in the feed.
- THEN THE system SHALL animate a subtle highlight on the newly added post card for 3 seconds to guide attention.

### Post-action Outcomes

- **For Authenticated Members**:
  - The home feed becomes a personalized, dynamically updated hub of community content.
  - User’s engagement (joining, voting, commenting) immediately influences their content exposure.
  - The right sidebar maintains awareness of platform-wide activity, encouraging community exploration.
  - The Recent Communities list grows organically as a reflection of active user interest.

- **For Guests**:
  - The feed serves as a public showcase of platform content, lowering the barrier to entry.
  - The guidance messaging and visibility of the Explore button support user conversion to members.
  - All interactive elements are gated with clear, non-disruptive login prompts.

- **For the System**:
  - The home feed abstraction handles both authenticated and guest states with a single rendering pipeline.
  - Sorting and pagination logic is consistent across all contexts (Home, Search, Explore).
  - The optimistic UI updates and session recovery pattern ensure high user retention and perceived reliability.

> *Developer Note: This document defines **business requirements only**. All technical implementations (architecture, APIs, database design, etc.) are at the discretion of the development team.*