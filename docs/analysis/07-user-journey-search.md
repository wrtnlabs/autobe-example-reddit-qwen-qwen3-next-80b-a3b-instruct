## User Journey: Global Search

This document describes the complete user journey for the global search functionality across the Community BBS platform. It details how users initiate searches, navigate between result types (posts, communities, comments), interact with results, and handle edge cases. This journey is consistent across all page contexts and follows the exact behavior specified in the product requirements.

### Search Initiation

WHEN a user types into the global search input field in the navbar, THE system SHALL enable the search function. WHERE the search query length is less than 2 characters, THE system SHALL not execute any search and SHALL display no results. WHILE the search input field is focused, THE system SHALL maintain the input context regardless of page navigation. WHEN the user presses Enter or clicks the [Search] button, THE system SHALL execute a search using the current query string.

### Post Search Flow

WHEN a user performs a search and selects the "Posts" tab (default), THE system SHALL search for matching posts across all communities by keyword analysis of post titles and bodies. THE system SHALL return posts where the search term appears as a whole word or substring in either the title or body. WHERE the search query is 2 or more characters, THE system SHALL sort results by [Newest] by default. WHILSt the "Posts" tab is active, THE system SHALL apply the "Newest" sort order unless explicitly changed by the user. WHEN a user changes the sort order to [Top], THE system SHALL sort posts by score (upvotes minus downvotes) in descending order, then by creation time (newest first), then by post identifier (highest ID first) if both score and creation time are identical. WHEN the search results exceed 20 items, THE system SHALL display exactly 20 post cards per page and show a [Load more] button at the bottom of the list. WHEN the user clicks [Load more], THE system SHALL load and append the next 20 search results to the list. THE system SHALL not load more than 20 posts per page. EACH post card SHALL display the following fields: community name, post title, body excerpt (limited to 2 lines with ellipsis), author display name, relative time of creation, comment count, and score (upvotes minus downvotes).

### Community Search Flow

WHEN a user switches to the "Sub-Communities" tab during a search, THE system SHALL search community names and descriptions for keyword matches. WHERE the search query is 2 or more characters, THE system SHALL sort results by [Name Match] by default. WHEN a user changes the sort order to [Recently Created], THE system SHALL sort communities by creation time (newest first). IF two communities have identical name match scores, THE system SHALL break the tie by creation time (newest first). WHEN the search results exceed 20 items, THE system SHALL display exactly 20 community cards per page and show a [Load more] button at the bottom of the list. WHEN the user clicks [Load more], THE system SHALL load and append the next 20 community search results to the list. THE system SHALL not load more than 20 communities per page. EACH community card SHALL display the following fields: community name, description (limited to 2 lines with ellipsis), community logo (if available, otherwise default), and a toggle button labeled [Join] or [Joined] based on the user's current membership status.

### Comment Search Flow

WHEN a user switches to the "Comments" tab during a search, THE system SHALL search for matching comments across all posts and communities by keyword analysis of comment text. WHERE the search query is 2 or more characters, THE system SHALL sort results exclusively by [Newest]. NO other sort options shall be available on the Comments tab. WHEN the search results exceed 20 items, THE system SHALL display exactly 20 comment snippets per page and show a [Load more] button at the bottom of the list. WHEN the user clicks [Load more], THE system SHALL load and append the next 20 comment search results to the list. THE system SHALL not load more than 20 comments per page. EACH comment snippet SHALL display the following fields: comment content (limited to 2 lines with ellipsis), author display name, relative time of creation, parent post title (as a clickable link), and community name.

### Result Display Behavior

WHEN the search results are being loaded, THE system SHALL display a loading spinner or skeleton view within the main content area. IF the user modifies the search query while results are loading, THE system SHALL cancel the pending request and initiate a new search with the updated query. WHEN search results are returned, THE system SHALL update the tab indicator and content area without refreshing the entire page. IF the user navigates away from the search page and returns later, THE system SHALL preserve the last search query and tab selection. WHERE the search query is 0 or 1 characters, THE system SHALL not display any results and SHALL show the empty state message. IF a user selects a community from search results, THE system SHALL navigate to that community's home page (/c/[name]) while maintaining the search context for future use.

### Empty State Handling

IF the search query is less than 2 characters, THE system SHALL display a single message: "Please enter at least 2 characters." IF the search query is 2 or more characters but returns no matching results, THE system SHALL display a single message: "No matching results. Try different keywords." IF the user has not performed any search and lands directly on the /s page, THE system SHALL display the empty state message: "Please enter at least 2 characters." WHERE a category filter is active during community search, THE system SHALL still apply the same empty state logic based on the presence of results.

### Error Handling

IF a temporary server-side error occurs during search execution, THE system SHALL display the standard system error message: "A temporary error occurred. Please try again in a moment." WHEN this error occurs, THE system SHALL retain the user's search query and selected tab so the user can retry the search with a single click. WHEN the user is logged out and attempts to perform a search, THE system SHALL not block the search execution — search results shall be visible to all users regardless of authentication status. WHERE an authentication state changes during a search, THE system SHALL update community join buttons on the Sub-Communities tab to reflect the user's latest membership status without requiring a full page reload. IF the search input is malformed (e.g., contains non-printable characters), THE system SHALL treat it as an empty string and display the "Please enter at least 2 characters." message.

### Mermaid Diagram: Global Search User Journey

```mermaid
graph LR
  A[User Enters Search Query] --> B{Query Length ≥ 2?}
  B -->|No| C[Show: "Please enter at least 2 characters."]
  B -->|Yes| D[Execute Search]
  D --> E[Show Results Tabs: Posts, Sub-Communities, Comments]
  E --> F[Default Tab: Posts]
  F --> G[Sort: Newest]
  G --> H[Show 20 Cards Per Page]
  H --> I[[Load more] Clicked?]
  I -->|Yes| J[Load Next 20 Results]
  I -->|No| K[Wait for User Action]
  E --> L[Sub-Communities Tab]
  L --> M[Sort: Name Match]
  M --> N[Show 20 Community Cards]
  N --> O[[Load more] Clicked?]
  O -->|Yes| P[Load Next 20 Communities]
  O -->|No| K
  E --> Q[Comments Tab]
  Q --> R[Sort: Newest Only]
  R --> S[Show 20 Comment Snippets]
  S --> T[[Load more] Clicked?]
  T -->|Yes| U[Load Next 20 Comments]
  T -->|No| K
  D --> V{Any Results?}
  V -->|No| W[Show: "No matching results. Try different keywords."]
  V -->|Yes| X[Display Results as Above]
  C --> W
  K --> Y[User Changes Query or Tab]
  Y --> D
  J --> H
  P --> N
  U --> S
```

> *Developer Note: This document defines **business requirements only**. All technical implementations (architecture, APIs, database design, etc.) are at the discretion of the development team.