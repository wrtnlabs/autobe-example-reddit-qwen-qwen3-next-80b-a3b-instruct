## User Journey: Sub-Community Interaction

This document details the complete user journey for discovering, joining, viewing, and interacting with sub-communities on the communitybbs platform. It covers the full flow from initial discovery through active participation, with explicit rules for state changes, permissions, and visual behavior. This document is intended for backend developers implementing the community-centric features.

### Community Discovery Flow

WHEN a user navigates to the /c page (Explore), THE system SHALL display a grid of community cards organized by category.

WHEN the user selects a category chip (e.g., [Tech & Programming]), THE system SHALL filter the community grid to show only communities assigned to that category.

WHILE the user is viewing the /c page, THE system SHALL load 20 community cards by default.

WHEN the user clicks [Load more], THE system SHALL append the next 20 community cards to the grid.

WHEN a community card is displayed, THE system SHALL show:
- The community logo (if provided), else a default placeholder
- The community name in bold
- The member count (e.g., "5.2k members") using abbreviation rules
- The "Join" button if the user is not a member, or "Joined" if the user has joined
- The community description truncated to two lines, with ellipsis if needed

WHERE the user has not performed any search, THE system SHALL display all communities, sorted alphabetically by name.

IF the user enters a search query of fewer than 2 characters in the global search bar while on /c, THE system SHALL not initiate a search and SHALL display no results.

IF the user enters a search query of 2 or more characters while on /c, THE system SHALL perform a community name match search, defaulting to "Name Match" sort.

WHEN sorting communities by "Name Match", THE system SHALL prioritize communities whose name most closely matches the search query.

WHEN two communities have identical name match scores, THE system SHALL show the more recently created community first.

WHEN no communities match the search query, THE system SHALL display "No matching results. Try different keywords."

### Community Home Page Flow

WHEN a user navigates to /c/[name], THE system SHALL load the community home page.

WHILE the user is on the community home page, THE system SHALL show the right sidebar with a fixed "Community Info + Rules" box.

WHEN the Community Info + Rules box is displayed, THE system SHALL show:
- The community logo (if provided), else a default placeholder
- The community name
- The community description
- The date the community was created (optional)
- The date of the most recent activity in the community (optional)
- A section titled "Community Rules"
- The top 5 rules from the community rules list, numbered 1 through 5
- Each rule text is limited to approximately 50 characters (two lines max)

WHERE the community has fewer than 5 rules defined, THE system SHALL display all available rules, numbered sequentially.

WHERE the user is not logged in, THE system SHALL hide the "Create Post" button on the community header.

WHERE the user is logged in, THE system SHALL show the "Create Post" button on the community header.

WHEN the user toggles the "Join" or "Joined" button on the community header, THE system SHALL immediately update the button state ("Join" ↔ "Joined") without waiting for server confirmation.

WHEN the "Join" button is clicked by an authenticated user, THE system SHALL:
- Add the community to the user's joined list
- Include all future posts from this community in the user's home feed
- Add this community to the left sidebar's Recent Communities list (if not already present)
- If the Recent Communities list already contains 5 communities, remove the least recently active one
- Update the join button to "Joined"
- Persist the join status on the server asynchronously

WHEN the "Joined" button is clicked by an authenticated user, THE system SHALL:
- Remove the community from the user's joined list
- Exclude all future posts from this community from the user's home feed
- Update the left sidebar's Recent Communities list by removing this community if it is present and no other active interaction remains
- Update the join button to "Join"
- Persist the leave status on the server asynchronously

WHILE the user is viewing the community home page, THE system SHALL display 20 posts from this community, sorted according to the selected sort order.

WHEN the user selects "Newest" from the sort dropdown, THE system SHALL display posts from this community ordered by creation date descending.

WHEN two posts have identical creation dates, THE system SHALL display the post with the larger post identifier first.

WHEN the user selects "Top" from the sort dropdown, THE system SHALL display posts from this community ordered by score (upvotes − downvotes) descending.

WHEN two posts have identical scores, THE system SHALL display the more recently created post first.

WHEN two posts have identical scores and identical creation dates, THE system SHALL display the post with the larger post identifier first.

WHEN the user clicks [Load more], THE system SHALL append the next 20 posts to the list.

WHEN a post card is displayed in the community feed, THE system SHALL show:
- The post title (truncated to one line with ellipsis if longer than 120 characters)
- The author display name (or "Anonymous" if empty)
- The creation time as a relative timestamp ("just now", "10 minutes ago", etc.)
- The comment count (e.g., "42 comments")
- The score (e.g., "+127")
- The community name as a link (/c/[name])

### Join/Leave Toggle Flow

WHEN the user clicks the "Join" button on a community page, THE system SHALL transition the button state to "Joined" immediately, then send an asynchronous request to join the community.

IF the server responds with "Community name taken" or "Unauthorized", THE system SHALL revert the button state to "Join" and display the error message: "This name is already in use." OR "Please sign in to continue."

IF the server responds with a successful join, THE system SHALL permanently update the user's membership status and update all related feeds: home feed, Recent Communities list.

WHEN the user clicks the "Joined" button on a community page, THE system SHALL transition the button state to "Join" immediately, then send an asynchronous request to leave the community.

IF the server responds with "Unauthorized" or "Temporary error", THE system SHALL revert the button state to "Joined" and display the error message: "Please sign in to continue." OR "A temporary error occurred. Please try again in a moment."

IF the server responds with a successful leave, THE system SHALL permanently update the user's membership status, remove this community's posts from the home feed, and remove it from the Recent Communities list if no other interaction has occurred.

WHERE the user attempts to join or leave a community while not logged in, THE system SHALL immediately show the login modal overlay with the message: "Please sign in to continue."

WHEN login is successfully completed, THE system SHALL return the user to their original page and re-attempt the join/leave action before any other action.

### Post Submission Flow

WHEN the user clicks the "Create Post" button on a community home page, THE system SHALL navigate to the community-specific composer at /c/[name]/submit.

WHEN a user is on /c/[name]/submit, THE system SHALL pre-select the community [name] in the community selector.

WHERE the user has navigated directly to /c/[name]/submit without being authenticated, THE system SHALL display the login modal with the message: "Please sign in to continue."

WHEN the user enters a title of fewer than 5 characters, THE system SHALL disable the Submit button and show the error: "Title must be between 5 and 120 characters."

WHEN the user enters a title of more than 120 characters, THE system SHALL disable the Submit button and show the error: "Title must be between 5 and 120 characters."

WHEN the user enters a body of fewer than 10 characters, THE system SHALL disable the Submit button and show the error: "Body must be between 10 and 10,000 characters."

WHEN the user enters a body of more than 10,000 characters, THE system SHALL disable the Submit button and show the error: "Body must be between 10 and 10,000 characters."

WHEN the user enters a display name longer than 32 characters, THE system SHALL truncate it to 32 characters without warning.

WHEN the user clicks Submit while all fields are valid, THE system SHALL send the post creation request to the server.

IF the server successfully creates the post, THE system SHALL navigate the user to the new post detail page at /c/[name]/[postID].

IF the server responds with an error (e.g., authentication expired), THE system SHALL display a temporary error message: "A temporary error occurred. Please try again in a moment." and retain the form state.

WHEN the user submits a post, THE system SHALL NOT validate the community membership status.

WHERE the user selects a community before logging in, THE system SHALL retain the community selection after successful authentication.

### Viewing Rules and Info Panel

WHEN the Community Info + Rules box is displayed on any community page, THE system SHALL always show the "Community Rules" section with a header labeled exactly "Community Rules".

WHEN displaying the community rules, THE system SHALL show only the top 5 rules, numbered 1, 2, 3, 4, 5.

WHEN a rule text exceeds two lines, THE system SHALL truncate it with an ellipsis and display as two lines max.

WHERE the community has no rules defined, THE system SHALL display "No rules defined." centered in the rules section.

WHERE the community has exactly one rule, THE system SHALL display "1. [rule text]" without trailing punctuation unless included by the community creator.

WHEN the user views the rules section while not logged in, THE system SHALL display the same content as when logged in.

### Error and Edge Cases

IF the user attempts to navigate to a community that does not exist (e.g., /c/nonexistent), THE system SHALL redirect to a 404 page with message: "Community not found."

IF the user attempts to post, comment, vote, or join a community while logged out, THE system SHALL display the login modal overlay with message: "Please sign in to continue." and resume the action upon successful login.

IF the user attempts to edit or delete a post not authored by them, THE system SHALL not display the Edit or Delete buttons and SHALL return the message: "You can edit or delete only items you authored." if an action was attempted.

IF the user attempts to vote on their own post or comment, THE system SHALL disable the vote buttons and show: "You can't vote on your own posts/comments."

IF the user attempts to create a community with a name containing special characters other than hyphen (-) or underscore (_), THE system SHALL show: "This name isn't available. Please choose something simpler."

IF the user attempts to create a community with a name already taken, THE system SHALL show: "This name is already in use."

IF the user attempts to create a community with a name consisting of only whitespace or empty string, THE system SHALL show: "This name isn't available. Please choose something simpler."

IF the user's session expires while viewing a community page, THE system SHALL display a gentle popup: "Your session has expired. Sign in to continue." and freeze all interactive elements until login.

WHEN the user successfully re-authenticates after session expiry, THE system SHALL re-enable the interface and resume the last interaction (e.g., voting, posting, joining) before the expiry.

IF the user's device has slow network speed when loading community posts, THE system SHALL show a skeleton loading state with 20 placeholder card elements, then replace them as data arrives.

IF a community's logo fails to load, THE system SHALL default to a standardized placeholder icon.

IF a community has no posts, THE system SHALL display: "This community has no posts yet. Be the first to share something!"

IF a post has no comments, THE system SHALL display: "No comments yet. Write the first one!" with the comment composer visible if logged in.

### Mermaid Diagram: Community User Journey

```mermaid
graph LR
    A[User navigates to /c/[name]] --> B[Display Community Home Page]
    B --> C[Display Right Sidebar: Community Info + Rules]
    C --> C1[Show Community Logo]
    C --> C2[Show Community Name]
    C --> C3[Show Community Description]
    C --> C4[Show Creation Date (Optional)]
    C --> C5[Show Last Active Date (Optional)]
    C --> C6[Show "Community Rules" Section]
    C6 --> C7[Display Top 5 Rules Numbered 1-5]
    C7 --> C8[Truncate Each Rule to 2 Lines with Ellipsis]
    C8 --> C9[Show "No rules defined." if no rules exist]
    
    B --> D[Display Main Content: 20 Posts]
    D --> D1[Sort by Selected Order: Newest or Top]
    D1 --> D2[If Newest: Sort by creation_time DESC, post_id DESC]
    D1 --> D3[If Top: Sort by score DESC, creation_time DESC, post_id DESC]
    D --> D4[Display Post Card: Community Name, Title, Author, Time, Comments, Score]
    D4 --> D5[Truncate Title to 120 Characters]
    D5 --> D6[Show Author as "Anonymous" if empty]
    D6 --> D7[Show Time as Relative Timestamp]
    D7 --> D8[Show Comment Count as Number]
    D8 --> D9[Show Score as Upvotes-Downvotes]
    
    B --> E[Display Header: Logo, Create Post Button, Join/Joined Button]
    E --> E1[Show "Create Post" Button if User is Authenticated]
    E --> E2[Display "Join" Button if User Hasn't Joined]
    E --> E3[Display "Joined" Button if User Has Joined]
    
    E2 --> F[User Clicks "Join"]
    F --> F1[Immediately Update Button to "Joined"]
    F1 --> F2[Add Community to User's Joined List]
    F2 --> F3[Add Community to Recent Communities List]
    F3 --> F4[Update Home Feed to Include This Community's Posts]
    F4 --> F5[Send Async Request to Server]
    
    E3 --> G[User Clicks "Joined"]
    G --> G1[Immediately Update Button to "Join"]
    G1 --> G2[Remove Community from User's Joined List]
    G2 --> G3[Remove Community from Recent Communities List]
    G3 --> G4[Update Home Feed to Exclude This Community's Posts]
    G4 --> G5[Send Async Request to Server]
    
    D --> H[User Clicks "Load more"]
    H --> H1[Fetch Next 20 Posts]
    H1 --> H2[Append to Page]
    
    E1 --> I[User Clicks "Create Post"]
    I --> I1[Redirect to /c/[name]/submit]
    I1 --> I2[Pre-select Community in Composer]
    
    I2 --> J[Check Authentication]
    J -->|Not Authenticated| K[Show Login Modal with Redirect]
    J -->|Authenticated| L[Show Post Composer]
    
    J --> M[User Submits Post]
    M --> M1[Validate Title: 5-120 Characters]
    M1 --> M2[Validate Body: 10-10,000 Characters]
    M2 --> M3[Validate Display Name: Max 32 Characters]
    M3 --> M4[Submit to Server]
    M4 -->|Success| N[Redirect to /c/[name]/[postID]]
    M4 -->|Failure| O[Display "A temporary error occurred. Please try again in a moment."]
    
    C --> P[User Is Not Logged In]
    P --> P1[Hide "Create Post" Button]
    P --> P2[Show "Join" Button]
    P2 --> Q[User Clicks "Join"]
    Q --> Q1[Show Login Modal with "Please sign in to continue."]
    Q1 --> Q2[On Login Success, Return to Community Page]
    
    B --> R[User Navigates Away]
    R --> R1[Preserve Selections in Local Storage]
    
    B --> S[Session Expires]
    S --> S1[Show Gentle Popup: "Your session has expired. Sign in to continue."]
    S1 --> S2[Freeze Interactive Elements]
    S2 --> S3[On Re-login, Resume Last Action]
    
    B --> T[Network Timeout]
    T --> T1[Show Skeleton Loading Cards for 20 Posts]
    T1 --> T2[Replace with Actual Data When Available]
    
    B --> U[No Posts Exist]
    U --> U1[Show: "This community has no posts yet. Be the first to share something!"]
    
    B --> V[No Comments]
    V --> V1[Show: "No comments yet. Write the first one!"]
    V1 --> V2[Show Comment Composer if Authenticated]
    
    B --> W[Community Has No Logo]
    W --> W1[Display Default Placeholder Icon]
    
    B --> X[Community Not Found]
    X --> X1[Redirect to 404 Page with "Community not found."]
    
    subgraph "Community Rule Formatting"
        C7 --> Y[Each Rule Max 50 Characters]
        Y --> Y1[Truncate to 2 Lines]
        Y1 --> Y2[Add Ellipsis]
    end
    
    subgraph "Post Display Formatting"
        D4 --> Z[Title Max 120 Characters]
        Z --> Z1[Truncate with Ellipsis]
        Z1 --> Z2[Author = "Anonymous" if Empty]
        Z2 --> Z3[Time = Relative Timestamp]
        Z3 --> Z4[Comment Count = Number]
        Z4 --> Z5[Score = Upvotes - Downvotes]
    end
    
    subgraph "Authentication State"
        P1 --> K
        E1 --> L
    end
```

> *Developer Note: This document defines **business requirements only**. All technical implementations (architecture, APIs, database design, etc.) are at the discretion of the development team.