# Home Page User Journey

This document details the complete user journey for the home page (​/​) of the community platform, covering interaction flows for both guest and registered users. Every behavior, transition, state change, and validation rule is described in natural language to ensure backend developers can implement the full business logic without ambiguity.

---

### Guest User Journey

When a user accesses the home page without an active session, they are treated as a guest. The system presents a unified feed designed to onboard and guide users toward joining communities.

WHEN a guest accesses the home page, THE system SHALL display the following:

- **Main Content Area**:
    - A prominent banner or highlighted message at the top stating: "Discover communities you'll love. Join to post, comment, and vote."
    - A list of 20 posts from across all communities, sorted by "Newest" as the default sort order.
    - The "Load more" button at the bottom to load additional posts (20 per click).
- **Right Sidebar**:
    - A header labeled "Global Latest."
    - A list of exactly 10 of the most recently posted items across all communities, regardless of whether they have been joined.
    - No "Load more" option.
- **Left Sidebar**:
    - Fixed navigation: Home (active), Explore, Create.
    - The "Recent Communities" list is empty.
    - All community links in the left sidebar are displayed as disabled text if the user is not logged in.

WHEN a guest attempts to perform any action that requires authentication (posting, commenting, voting, joining or leaving a community, or using the "Create Post" button), THE system SHALL:

- Prevent the action visually by disabling buttons and indicators.
- Show a tooltip when hovering over disabled elements stating: "Please sign in to continue."
- Display a modal login overlay when the user clicks on any of these disabled elements.

WHEN a guest clicks on a post card in the main feed or the Global Latest sidebar, THE system SHALL:

- Navigate the user to the post detail page (​/c/[name]/[postID]​).
- Allow full reading of the post and all comments.
- Disable all interactive elements on the post detail page, including comment composer, upvote/downvote buttons, and Edit/Delete buttons.
- Show tooltips above disabled elements with: "Please sign in to continue."

WHEN a guest is redirected to the login modal via any action, THE system SHALL:

- Preserve the context of the intended action (e.g., "try to vote" or "join community").
- After successful login, automatically return the user to the exact page and scroll position they were on, and re-attempt the original action (e.g., voting, joining).

WHILE a guest is viewing the home page, THE system SHALL maintain the feed in a static state with no real-time updates unless a navigation action occurs.

---

### Member User Journey

When a user accesses the home page with an active authenticated session, they are considered a member. The system personalizes the content based on the communities they have joined.

WHEN a member accesses the home page, THE system SHALL:

- Display the Main Content Area with up to 20 post cards from only the communities the member has joined.
- If the member has joined no communities, FALL BACK to showing 20 posts from across all communities ordered by "Newest" (same as guest experience), with an additional banner at the top: "Start exploring communities. Join one to personalize your feed."
- Use the currently selected sort order (default: "Newest").
- Display the bottom "Load more" button to load the next 20 post cards.

WHEN a member has joined one or more communities, THE system SHALL:

- Prioritize and only display posts from those communities in the main feed.
- Include posts from a community as soon as the member joins it.
- Hide posts from a community immediately upon the member leaving it.
- Update the post list in real time without requiring a page reload.

WHEN a member uses the "Explore" button from the left sidebar, THE system SHALL:

- Navigate to the /c page where they can browse and search communities.
- Not alter the joined/unjoined status of any community while browsing.
- Maintain the current sort order selection for when they return to the home page.

WHEN a member accesses a community they have joined from the "Recent Communities" list (left sidebar), THE system SHALL:

- Redirect to ​/c/[name]​.
- Preserve the "Newest" or "Top" sort order they had on the home feed (if any).
- Show the community’s header with "Joined" button. 

WHEN a member clicks the "Create Post" button in the navbar, THE system SHALL:

- Redirect to the global post composer (​/submit​) with no community pre-selected.
- Not disable the button.

WHILE a member is viewing the home page, THE system SHALL:

- Continuously display updates to the main feed as new posts are made by joined communities.
- For newly posted items that match their joined communities, insert them at the top of the list according to the current sort order.
- If the sort order is "Top," newly posted items with high scores may appear higher in the list even if created later.

---

### Feed Loading Process

All feed loading on the home page follows consistent pagination and ordering rules to ensure predictable backend behavior.

WHEN the home page loads initially, THE system SHALL:

- Fetch and render exactly 20 post cards.
- If the member has joined any communities, filter the result set to only include posts from those communities.
- If the member has not joined any communities, the result set includes posts from all communities.
- The sort order used is the one currently selected by the user (default: "Newest").

WHEN the user clicks the "Load more" button, THE system SHALL:

- Fetch the next 20 posts based on the same sort order.
- Ensure no duplicates exist between the previously loaded set and the new set.
- Append the new cards at the bottom of the existing list.
- If fewer than 20 posts remain, load all remaining posts with no "Load more" button shown afterward.

WHILE a member is scrolling the main feed, THE system SHALL use the following sorting rules in ascending order of priority:

**Newest Sort Order**:
- WHEN the system sorts by "Newest", THE system SHALL:
    - Order posts by creation timestamp (descending).
    - IF two or more posts have identical creation timestamps, THE system SHALL sort by post identifier (larger identifier appears first).

**Top Sort Order**:
- WHEN the system sorts by "Top", THE system SHALL:
    - Order posts by score (upvotes minus downvotes, descending).
    - IF two or more posts have identical scores, THE system SHALL sort by creation timestamp (more recent appears first).
    - IF two or more posts have identical scores and identical creation timestamps, THE system SHALL sort by post identifier (larger identifier appears first).

WHERE the sort order is selected as "Top" in the dropdown, THE system SHALL:

- Show "Top" as the selected option in the sort control.
- Keep this selection persistent across sessions if the user remains logged in.
- Maintain the order even if the user temporarily navigates away and returns.

WHEN a user changes the sort order (clicks "Newest" or "Top"), THE system SHALL:

- Immediately re-render the main feed with all active posts (20 items) re-sorted according to the new criteria.
- Reset the "Load more" pointer to the beginning of the sorted list.
- Persist the user's selection in local storage.

---

### Sorting Behavior

The sorting hierarchy and tie-breaking rules are essential for consistent backend implementation.

WHEN a poll of posts is retrieved from the system in response to a sort request, THE system SHALL apply:

- Exact business logic as defined in Section 3.5 of the product requirements.
- Numeric comparison for scores (upvotes &#8722; downvotes).
- Datetime comparison for creation timestamps.
- Numeric comparison for post identifier (assumed to be an auto-incrementing or UUID-based index).

WHERE the system retrieves posts, THE system SHALL ensure that:

- The API or service layer does not attempt to implement randomness.
- All sorting is deterministic and repeatable.
- Pagination tokens or offsets are based on the sort key, not on page numbers.

WHEN two or more posts have identical values for all primary sort criteria, THE system SHALL:

- Break ties using the post identifier.
- Use larger post identifier as higher rank.
- Do not use author, community, or title to break ties.

---

### Join/Leave Interaction

The toggle between "Join" and "Joined" is a core interaction that directly affects the main feed and Recent Communities list.

WHEN a member clicks the "Join" button on the home page's "Discover communities" banner, THE system SHALL:

- Toggle the button to "Joined".
- Immediately include all current and future posts from that community into the main feed.
- Add the community to the "Recent Communities" list in the left sidebar.
- If the "Recent Communities" list already contains 5 communities, remove the oldest entry before adding the new one.
- Sort the Recent Communities list by most recent activity (join, comment, or post).
- Do not refresh the entire page.
- Show no notification or confirmation message.

WHEN a member already has a community in their "Recent Communities" list and clicks "Joined" on the home page phone banner, THE system SHALL:

- Toggle the button to "Join".
- Immediately remove all posts from that community from the main feed.
- Remove the community from the "Recent Communities" list.
- Not affect any other communities in the list.
- Update the list in real time without page reload.

WHEN a member joins a community via any other route (e.g., from ​/c/[name]​ or search results), THE system SHALL:

- Apply the same feed and list updates as described above.
- Ensure the "Joined" button state is consistent across all pages.

WHILE a member is connected and starts a new community session, THE system SHALL:

- Update the timestamp of the community in the "Recent Communities" list to the current time.
- Re-sort the list, moving the community to the top.
- Reset the age counter for all other communities.

IF a member attempts to join a community they have already joined, THE system SHALL:

- Ignore the request.
- Do not toggle the button or refresh the state.
- Do not trigger an error message.

IF a member attempts to leave a community they have not joined, THE system SHALL:

- Ignore the request.
- Do not toggle the button or refresh the state.
- Do not trigger an error message.

---

### Error and Edge Cases

This section covers all edge scenarios to prevent ambiguity in implementation.

IF a member has joined zero communities and their session expires, THE system SHALL:

- Upon re-login, return them to the home page.
- Display the fallback feed (posts from all communities) with the "Start exploring communities" banner.
- Maintain their last selected sort order ("Newest" or "Top").

IF a new post is created in a community that the member has not joined, THE system SHALL:

- Never display the post in the main feed.
- Still display the post in the Global Latest sidebar if it is among the top 10 newest.

IF a member deletes one of their own posts after it has been loaded in their feed, THE system SHALL:

- Immediately remove the post card from the main feed.
- Not affect the page count or "Load more" state.
- If the deletion causes the main feed to have fewer than 20 posts, do not automatically load more.

IF a post receives a vote after being loaded, and the vote changes the sort rank relative to other posts, THE system SHALL:

- If "Top" sort is active, re-order the post within the existing 20-item page if its new score changes its relative position.
- If the post moves out of the top 20, remove it from the main feed.
- If a post moves into the top 20, insert it at the correct position.

IF the Global Latest sidebar updates while the user is viewing the home page, THE system SHALL:

- Show the updated list only if a new post ranks within the top 10 (by time).
- Not refresh automatically — only update upon full page reload or deliberate refresh.
- Never set a timer or auto-refresh the sidebar.

IF the member has scrolled deep into the feed (beyond the first page) and then changes the sort order, THE system SHALL:

- Reset the feed to the first page of results according to the new sort.
- Scroll the user back to the top of the page.

IF the database returns an incomplete or corrupted set of 20 posts, THE system SHALL:

- Show the "temporary error" message: "A temporary error occurred. Please try again in a moment."
- Keep the "Load more" button functional for next retry.
- Do not freeze or crash the UI.

IF two users attempt to join the same community simultaneously, THE system SHALL:

- Process both requests successfully.
- Increment the member count correctly.
- Ensure the "Joined" button remains consistent for both users.

IF the community selected in a join request does not exist (corrupted URL/direct link), THE system SHALL:

- Redirect to the home page.
- Do not display any error.
- Show the user's usual feed (joined or fallback).

---

### Mermaid Diagram: Home Page User Journey Flow

```mermaid
graph LR
    A[User opens /home] --> B{Is user logged in?}
    B -->|No| C[Guest Experience]
    B -->|Yes| D[Member Experience]

    C --> C1[Show banner: "Discover communities..."]
    C --> C2[Show 20 global posts (Newest)]
    C --> C3[Show Global Latest sidebar (10 posts)]
    C --> C4[Disable all actions: post/comment/vote/join]
    C --> C5[On click → Show login modal]
    C5 --> C6[After login → Return to /home + resume action]

    D --> D1[Show main feed: posts from joined communities]
    D --> D2[If joined=0 → show fallback: 20 global posts + "Start exploring" banner]
    D --> D3[Show sort control: Newest/Top → prev selection]
    D --> D4[Show Load more button]
    D --> D5[Right sidebar: Global Latest (10 newest posts)]
    D --> D6[Left sidebar: Recent Communities (≤5, by most recent activity)]

    D1 --> E[Click "Load more"]
    E --> E1[Fetch next 20 posts by current sort]
    E1 --> D1

    D1 --> F[Click "Newest"]
    F --> F1[Re-sort feed: creation time → post ID]
    F1 --> D1

    D1 --> G[Click "Top"]
    G --> G1[Re-sort feed: score → creation time → post ID]
    G1 --> D1

    D6 --> H[Click "Join" on banner/sidebar]
    H --> H1[Toggle to "Joined"]
    H1 --> H2[Add community to Recent Communities list]
    H2 --> H3[Include community’s posts in main feed]

    D6 --> I[Click "Joined" on banner/sidebar]
    I --> I1[Toggle to "Join"]
    I1 --> I2[Remove community from Recent Communities]
    I2 --> I3[Remove community’s posts from feed]

    D1 --> J[Click post card]
    J --> J1[Navigate to /c/[name]/[postID] - stay logged in]

    D3 --> K[Click "Create Post"]
    K --> K1[Navigate to /submit]

    D4 --> L[Click disabled control]
    L --> L1[Show: "Please sign in to continue."]

    subgraph "Sorting Logic"
        D1 --> O1[Sort: Newest]
        O1 --> O2[Order: creation_time DESC]
        O2 --> O3[If same: post_id DESC]

        D1 --> P1[Sort: Top]
        P1 --> P2[Order: score DESC]
        P2 --> P3[If same: creation_time DESC]
        P3 --> P4[If same: post_id DESC]
    end

    D1 --> Q[Vote on post]
    Q --> Q1[If poster is self → Show: "You can’t vote on your own posts/comments."]
    Q --> Q2[Else → Update UI instantly (optimistic) → sync with server]

    D1 --> R[Edit or Delete post]
    R --> R1[If not author → Hide buttons]
    R --> R2[If author → Show buttons]

    D --> S[Session expires]
    S --> S1[Show login modal gently]
    S1 --> S2[After login → return to /home]
```

> *Developer Note: This document defines **business requirements only**. All technical implementations (architecture, APIs, database design, etc.) are at the discretion of the development team.