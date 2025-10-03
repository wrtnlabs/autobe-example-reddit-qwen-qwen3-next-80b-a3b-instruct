## User Journey: Global Search

### User Persona

**Search Explorer** is a regular member of the community platform who wants to discover new content and communities. They may be new to the platform and seeking topics aligned with their interests, or an existing member looking for specific posts, communities, or comments. This user understands the platform’s structure and expects intuitive, predictable behavior when performing searches. They rely on the search function as their primary tool for content discovery beyond curated feeds.

### Goal Statement

The Search Explorer wants to find relevant posts, sub-communities, or comments across the platform using keywords. They need to see accurate, filtered, and sorted results quickly, with clear feedback when no results exist or when their query is too short. Their goal is to navigate the platform efficiently without confusion or frustration.

### Pre-conditions

- The user is either authenticated (member) or unauthenticated (guest).
- The user has navigated to the `/s` page from any other page in the application.
- The global navigation bar is visible, with the search input pre-focused.
- The user has entered 0 or more characters into the search input field.
- The user has not yet initiated a search or has initiated an invalid search.

### Main Success Scenario

1. WHEN a user types at least 2 characters into the global search bar (e.g., "ai" or "gaming"), THE system SHALL automatically trigger a search request after a 300ms debounce period or when the user submits the form.
2. THE system SHALL return results organized into three tabbed panels: Posts, Sub-Communities, and Comments.
3. THE Posts tab SHALL be selected by default.
4. THE system SHALL sort results by Newest, as per the default sort rule.
5. THE system SHALL render exactly 20 results per tab.
6. WHEN results are displayed:
   - FOR Posts, THE system SHALL show: community name, post title, excerpt of body (max 2 lines, truncated with ellipsis), author display name (or "Anonymous"), relative time, comment count, and vote score (upvotes minus downvotes).
   - FOR Sub-Communities, THE system SHALL show: community name, description (max 2 lines, truncated with ellipsis), community logo (if present, otherwise default), and a Join / Joined toggle button (visible and interactive only if user is authenticated).
   - FOR Comments, THE system SHALL show: raw comment content (max 2 lines, truncated with ellipsis), author display name (or "Anonymous"), relative time, parent post title (clickable link), and community name.
7. THE system SHALL display a [Load more] button at the bottom of the result list in each tab.
8. WHEN the user clicks [Load more], THE system SHALL load and append the next 20 results without reloading the page.
9. WHEN the user toggles between tabs (Posts, Sub-Communities, Comments), THE system SHALL immediately refresh the results for the selected tab.
10. WHEN the user selects the Sub-Communities tab, THE system SHALL:
   - Set the default sort order to Name Match (highest relevance to the query).
   - Use creation date (newest first) as a fallback sort if name match scores are equal.
11. WHEN the user selects the Comments tab, THE system SHALL:
   - Fix the sort order to Newest.
   - Hide the sort dropdown control.
12. THE search query SHALL persist in the input field and SHALL remain editable to refine results.

### Alternative Scenarios

#### A. Query Too Short (Less than 2 characters)

- WHEN a user types fewer than 2 characters (e.g., "a" or "c"), THE system SHALL display a persistent placeholder below the input field: "Please enter at least 2 characters."
- THEN THE system SHALL NOT execute any search or return any results.
- THEN THE system SHALL NOT update any tab content.
- WHERE the input is empty or contains exactly one character, THE system SHALL keep the placeholder visible until the user enters two or more characters.

#### B. No Results Found

- WHEN a search query returns zero results for a specific tab (e.g., searching for "xyz123" for comments), THE system SHALL display a centered, empty-state message under the tab header: "No matching results. Try different keywords."
- THEN THE system SHALL hide the [Load more] button for that tab.
- THEN THE system SHALL preserve the search query in the input field.
- THEN THE system SHALL show empty tab content but retain tab navigation functionality.
- THEN THE system SHALL NOT affect results in other tabs.

#### C. Guest User Searches

- WHILE the user is unauthenticated (guest), THE system SHALL show the same results for Posts, Sub-Communities, and Comments as an authenticated member.
- THEN THE system SHALL display the Join button as disabled and grayed-out for all sub-community cards.
- THEN THE system SHALL show a tooltip on hover: "Sign in to join this community."
- THEN THE system SHALL allow all search interactions and result viewing without interruption.

#### D. Member Joins After Searching (Optimistic UI)

- WHEN a user is logged in and clicks Join on a sub-community card in the Sub-Communities tab, THE system SHALL immediately change the button text to "Joined" and disable it.
- THEN THE system SHALL NOT wait for server response to update the UI.
- WHERE the operation succeeds later, THE system SHALL maintain the "Joined" state.
- WHERE the operation fails, THE system SHALL revert the button state to "Join" and show: "A temporary error occurred. Please try again in a moment."

#### E. Session Expired During Search

- WHILE the user is actively performing a search, IF the authentication token expires during request, THE system SHALL show a non-intrusive overlay modal: "Please sign in to continue."
- THEN THE system SHALL pause the search flow but preserve the current query.
- THEN THE system SHALL NOT reload the page.
- WHEN the user successfully authenticates in the modal, THE system SHALL resume the search request with the same query and return to the same tab.

#### F. Selecting a Different Sort Order - Posts Tab

- WHEN the user selects [Top] from the sort dropdown on the Posts tab, THE system SHALL sort results by:
   - Primary: Highest score (upvotes minus downvotes) descending
   - Secondary: Most recent creation time (newest first)
   - Tertiary: Largest post identifier (highest numeric ID)
- THEN THE system SHALL immediately update the result list with sorted results.
- THEN THE system SHALL update the button label to reflect the selected order.

#### G. Selecting a Different Sort Order - Sub-Communities Tab

- WHEN the user selects [Recently Created] from the sort dropdown on the Sub-Communities tab, THE system SHALL sort results by:
   - Primary: Creation date (newest first)
   - Secondary: Name match score (if creation dates are equal)
- THEN THE system SHALL immediately update the result list.
- THEN THE system SHALL update the button label to reflect the selected order.

#### H. Search with Special Characters

- WHEN a user enters a query with punctuation, emojis, or symbols (e.g., "how to fix 🐞", "C++" or "AI:2025"), THE system SHALL treat the entire query as a free-text string for matching.
- THEN THE system SHALL search for substring matches in titles, bodies, and descriptions (case-insensitive).
- THEN THE system SHALL ignore special characters for stemming or tokenization.
- THEN THE system SHALL NOT require exact phrase matches unless enclosed in quotes (which are not supported).

### Post-action Outcomes

- The user either:
   - Found desired content and navigated to a post, comment, or community — continuing their journey.
   - Got no results and refined their query — indicating an opportunity to improve keyword suggestions or community indexing.
   - Did not enter enough characters — experience was clear and guiding.
- THE system SHALL maintain consistent behavior across authentication states.
- THE user’s search intent SHALL be met without interruption, confusion, or technical failure.
- THE UI SHALL remain responsive and continue to use relative timestamps (e.g., "2 minutes ago"), localized to Asia/Seoul timezone.
- THE system’s search index SHALL be updated in the background with the latest content, without requiring user action.

> *Developer Note: This document defines **business requirements only**. All technical implementations (architecture, APIs, database design, etc.) are at the discretion of the development team.*