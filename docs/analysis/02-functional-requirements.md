# Functional Requirements

## Core Functionality Overview

The Community Platform is a moderated, user-generated content system where users can discover and participate in topic-based sub-communities. The core value proposition is to enable structured, interest-based discussions with reputation-driven content visibility through upvotes and downvotes. The system operates under the principle that reading is universally accessible, but all participation activities require authentication. Ownership of content is strictly account-based, ensuring users retain control over their contributions. Sessions are maintained generously to ensure uninterrupted user experience, and failed authentication during actions is handled by prompting seamless re-login to resume the original intent.

THE system SHALL enable community-driven content discovery, participation, and moderation through structured sub-communities with reputation-based content ordering.

WHEN a user accesses the platform, THE system SHALL differentiate between authenticated and unauthenticated users in all interface behaviors, data access, and action permissions.

WHILE a user session is active, THE system SHALL preserve the user's authentication state and maintain session continuity until explicit logout or expiration.

WHEN a user session expires, THE system SHALL trigger a non-modal, unobtrusive re-authentication prompt that allows the user to resume their prior action without losing context.

THE system SHALL apply consistent content ownership rules: users MAY edit or delete only content they authored, regardless of community membership or moderation status.

## Home Feed Requirements

THE system SHALL display the main home feed (at /) as a unified stream of posts from sub-communities that the authenticated user has joined.

WHEN a user has not joined any sub-community, THE system SHALL display the most recently created or highest-scoring posts from all public sub-communities.

WHEN a user has not joined any sub-community, THE system SHALL display a contextual message or guidance prompt in the main feed area encouraging exploration and joining of communities.

WHEN the user selects a sort order, THE system SHALL reorder the main feed according to the specified criteria:

- WHEN the selected sort order is "Newest", THE system SHALL sort posts by creation timestamp in descending order (most recent first)
- WHERE creation timestamps are identical, THE system SHALL sort posts by internal identifier in descending order (larger ID comes first)

- WHEN the selected sort order is "Top", THE system SHALL sort posts by calculated score (upvotes - downvotes) in descending order (highest score first)
- WHERE scores are equal, THE system SHALL sort posts by creation timestamp in descending order (most recent first)
- WHERE creation timestamps are also equal, THE system SHALL sort posts by internal identifier in descending order (larger ID comes first)

THE system SHALL paginate the main feed in pages of 20 post cards per page.

WHEN the user reaches the end of a page, THE system SHALL display a "[Load more]" button that, when activated, retrieves and appends the next 20 posts in the sorted sequence.

THE system SHALL not display a "Load more" button if fewer than 20 posts remain in the sorted list.

## Right Sidebar - Global Latest Posts

THE system SHALL display a fixed right sidebar on the Home page labeled "Global Latest".

WHEN the Home page loads, THE system SHALL display exactly 10 of the most recently created posts across ALL communities, regardless of user subscription status.

THE system SHALL NOT provide a "Load more" option for the Global Latest sidebar - it SHALL display exactly 10 items at all times.

WHEN a new post is created in any community, THE system SHALL ensure it becomes eligible for inclusion in the Global Latest listing within 2 seconds of server persistence.

WHERE a post is deleted, THE system SHALL immediately remove it from the Global Latest listing.

WHEN the Global Latest sidebar is displayed, THE system SHALL present each item with the following visual elements:

- Community name (formatted as /c/[community-name])
- Single-line truncated post title (ellipsized if longer than 100 characters)
- Relative timestamp (e.g., "5 minutes ago", "1 hour ago") displayed in the user’s local timezone (Asia/Seoul)

## Community Management Requirements

THE system SHALL allow members to create public sub-communities with unique alphanumeric names that MAY include hyphens (-) and underscores (_).

WHEN a member attempts to create a community with a name already in use, THE system SHALL reject the request and display "This name is already in use."

WHEN a member attempts to create a community with a name containing invalid characters (e.g., spaces, periods, symbols beyond hyphen/underscore), THE system SHALL reject the request and display "This name isn't available. Please choose something simpler."

THE system SHALL enforce a minimum name length of 1 character and a maximum length of 50 characters.

THE community name SHALL be immutable after creation.

THE system SHALL associate each community with an optional category from the following predefined list: [Tech & Programming] [Science] [Movies & TV] [Games] [Sports] [Lifestyle & Wellness] [Study & Education] [Art & Design] [Business & Finance] [News & Current Affairs].

THE system SHALL allow communities to have optional descriptions (up to 500 characters), optional logo images, and optional banner images.

WHERE no logo is provided, THE system SHALL display a default community icon in all UI representations.

WHERE no banner is provided, THE system SHALL display a default banner image or gradient.

THE system SHALL allow communities to have optional rules, formatted as a numbered list (1, 2, 3...).

WHEN a user attempts to create a community with more than 20 rules, THE system SHALL accept the input but only persist and display the first 20.

THE system SHALL allow community owners to edit their community's description, logo, banner, and rules — but SHALL NOT permit renaming of the community.

WHEN a user who is not the original creator attempts to edit a community, THE system SHALL deny the request and display "You can only edit communities you created."

WHEN a community is deleted, THE system SHALL immediately cascade-delete ALL associated posts and comments.

WHEN a community is deleted, THE system SHALL remove it from all user "Recent Communities" lists.

THE system SHALL update the member count of a community in real-time based on successful join/leave actions.

THE system SHALL display the member count as a numeric value (e.g., "3.2k members") and shall use number abbreviations for values 1,000 and above (e.g., 1,000 → 1k, 10,000 → 10k, 1,000,000 → 1m)

## Join / Leave Requirements

WHEN a user clicks the "Join" button on a community page, THE system SHALL immediately update their membership status to "Joined".

THE system SHALL then:

- Add the community to the user’s personal feed eligibility list
- Update the "Recent Communities" list in the left sidebar if it contains fewer than 5 entries, or if it is among the 5 most recently active communities
- Change the button label from "Join" to "Joined"

WHEN a user clicks the "Joined" button on a community page, THE system SHALL immediately update their membership status to "Not joined".

THE system SHALL then:

- Remove the community from the user’s joined communities list
- Update the "Recent Communities" list in the left sidebar if the community was present
- Change the button label from "Joined" to "Join"

WHERE a community is removed from the "Recent Communities" list because another community has more recent activity, THE system SHALL preserve the maximum limit of 5 communities.

THE system SHALL update the "Recent Communities" list based on activity recency, where activity is defined as:
- First post creation
- First comment on a post
- First vote on a post or comment
- First join/leave action

THE system SHALL order the Recent Communities list by the timestamp of the user's most recent activity within that community, descending.

## Post Management Requirements

THE system SHALL allow members to create posts by selecting a target sub-community.

WHEN a user attempts to create a post without selecting a community, THE system SHALL prevent submission and display "Please choose a community to post in."

THE system SHALL require post titles to be 5-120 characters inclusive.

WHEN a title is shorter than 5 characters, THE system SHALL reject the post and display "Title must be at least 5 characters long."

WHEN a title is longer than 120 characters, THE system SHALL reject the post and display "Title cannot exceed 120 characters."

THE system SHALL require post bodies to be 10-10,000 characters inclusive.

WHEN a body is less than 10 characters, THE system SHALL reject the post and display "Post content must be at least 10 characters long."

WHEN a body exceeds 10,000 characters, THE system SHALL reject the post and display "Post content cannot exceed 10,000 characters."

THE system SHALL prohibit all HTML, CSS, JavaScript, or executable code in post bodies — only plain text with line breaks (\n) SHALL be allowed.

WHEN a user submits a post containing a script tag or JavaScript, THE system SHALL strip it and replace with a notification message: "Script content has been removed for security."

THE system SHALL allow an optional author display name between 0-32 characters.

WHEN no author display name is provided, THE system SHALL display "Anonymous" as the default author name.

THE system SHALL restrict editing and deletion of a post to the user who authored it.

WHEN a user attempts to edit or delete a post they did not author, THE system SHALL deny the request and display "You can edit or delete only items you authored."

WHEN a post is edited, THE system SHALL preserve the original creation timestamp and not update it.

THE system SHALL render each post card in feeds with:

- Community name (e.g., /c/ai)
- Post title
- Author name (or "Anonymous" if unspecified)
- Relative creation timestamp (e.g., "just now", "3 hours ago")
- Comment count (numeric value)
- Score (upvotes minus downvotes)

THE system SHALL update post card metrics (comment count, score, author) in real-time when changes occur.

## Comment System Requirements

THE system SHALL allow authenticated users to add, edit, and delete comments on posts.

THE system SHALL require comments to be 2-2,000 characters inclusive.

WHEN a comment is less than 2 characters, THE system SHALL reject it with "Comment must be at least 2 characters long."

WHEN a comment exceeds 2,000 characters, THE system SHALL reject it with "Comment cannot exceed 2,000 characters."

THE system SHALL allow multi-level nested replies — every comment MAY be replied to, and replies to replies are allowed.

THE system SHALL NOT impose a limit on nesting depth.

WHEN a user tries to edit or delete a comment, THE system SHALL verify ownership and only permit the original author to perform the action.

WHEN a non-author attempts to edit or delete a comment, THE system SHALL deny the request and display "You can edit or delete only items you authored."

WHEN a comment is edited, THE system SHALL preserve the original creation time and display an "edited" label.

WHEN a post is deleted, THE system SHALL cascade-delete all associated comments.

WHEN a comment is deleted, THE system SHALL decrement the parent post's comment count.

THE system SHALL display comments in threaded order: parent comments first, then child replies nested beneath.

THE system SHALL paginate comments on the post detail page in groups of 20.

WHEN the user reaches the end of the visible comment list, THE system SHALL display a "[Load more]" button to retrieve the next 20 comments.

## Voting System Requirements

THE system SHALL allow users to upvote or downvote posts and comments.

Users SHALL have exactly one voting state per post or comment: None, Upvote, or Downvote.

WHEN a user has no vote on an item, clicking "Upvote" SHALL set the state to Upvote.

WHEN a user has no vote on an item, clicking "Downvote" SHALL set the state to Downvote.

WHEN a user has an Upvote state, clicking "Upvote" SHALL revert their state to None.

WHEN a user has a Downvote state, clicking "Downvote" SHALL revert their state to None.

WHEN a user has an Upvote state and clicks "Downvote", THE system SHALL immediately update the state to Downvote.

WHEN a user has a Downvote state and clicks "Upvote", THE system SHALL immediately update the state to Upvote.

THE system SHALL prevent users from voting on their own posts or comments.

WHEN a user attempts to vote on their own content, THE system SHALL display "You can't vote on your own posts/comments."

THE system SHALL NOT allow users to remove or change other users' votes.

THE system SHALL calculate score for each post or comment as: (number of Upvotes) - (number of Downvotes)

THE system SHALL apply score changes optimistically in the UI without waiting for server confirmation.

THE system SHALL immediately update the displayed score and voting button state when a user votes.

THE system SHALL reconcile state with the server asynchronously and revert UI changes if there is a failure.

THE system SHALL NOT display a voting control between a user's own post/comment and their own reply to that post/comment.

## Search System Requirements

THE system SHALL provide global search across posts, sub-communities, and comments using a single search interface at /s.

/search query MUST be a minimum of 2 characters.

WHEN a user enters less than 2 characters, THE system SHALL display "Please enter at least 2 characters."

WHEN a user enters a search query of 2+ characters, THE system SHALL provide results in three tabs: Posts, Sub-Communities, Comments.

THE initial tab when search loads SHALL be Posts.

WHEN a user searches for posts:

- THE system SHALL match query against both title and body
- THE system SHALL sort results by "Newest" by default
- THE system SHALL allow switching to "Top" sort
- "Newest" sort: sort by creation time descending, then by internal ID descending for ties
- "Top" sort: sort by score descending, then by creation time descending, then by internal ID descending for ties
- THE system SHALL return results in pages of 20
- Each result card SHALL show:
  - Community name
  - Post title
  - Body excerpt (max 2 lines, truncated with ellipsis)
  - Author name
  - Relative timestamp
  - Comment count
  - Score

WHEN a user searches for sub-communities:

- THE system SHALL match query against community name or description
- DEFAULT sort: "Name Match" (highest similarity to query, using lexicographic and edit distance metrics)
- ALTERNATE sort: "Recently Created" (by community creation date, descending)
- THE system SHALL show results in pages of 20
- Each result card SHALL show:
  - Community name
  - Description (max 2 lines with ellipsis)
  - Logo (if available)
  - "Join" or "Joined" button

WHEN a user searches for comments:

- THE system SHALL match query against comment body only
- THE system SHALL sort results by Newness only (creation timestamp descending)
- THE system SHALL show results in pages of 20
- Each result item SHALL show:
  - Comment body excerpt (max 2 lines with ellipsis)
  - Author name
  - Relative timestamp
  - Link to parent post title
  - Parent community name

WHERE no results exist for a search term, THE system SHALL display: "No matching results. Try different keywords."

THE system SHALL clear search results and reset the UI when the user changes the search query.

## Navigation and Layout Requirements

THE system SHALL maintain a fixed left sidebar on all pages containing:

- Global navigation buttons: "Home", "Explore", "Create"
- "Recent Communities" list: maximum 5 communities, ordered by most recent activity (as defined in Join/Leave requirements)

Each community in the Recent Communities list SHALL show:

- Community name
- Community logo (or default icon if none)

Each item in the Recent Communities list SHALL be a clickable link to the community’s home page.

THE system SHALL render a global top navigation bar on all pages containing:

- Logo (links to /)
- Global search input field (always visible and focused on initial load)
- "Create" button (links to /submit)
- Profile dropdown (contains "Settings" and "Logout")

THE right sidebar SHALL change contextually based on the page:

- On the Home page: SHALL show "Global Latest" (10 most recent posts across all communities)
- On Community Home, Post Detail, or Community Create pages: SHALL show "Community Info + Rules"

THE Community Info + Rules box SHALL always display:

- Community name
- Description (if present)
- Created date (optional)
- Last active timestamp (optional)
- Rules section with title "Community Rules"

THE rules section SHALL:

- Show only the top 5 rules in numbered format (1., 2., 3., etc.)
- Each rule SHALL be truncated to a maximum of 50 characters per line, with a maximum of 2 lines per rule
- If more than 5 rules exist, SHALL display a "Show all" link beneath the top 5

THE login modal SHALL appear as an overlay on top of any page when an action requires authentication (posting, commenting, voting, joining, creating)

WHEN login completes successfully, THE system SHALL return the user to the exact page and state before authentication was triggered, and SHALL resume the original action (e.g., posting after login)

WHEN authentication fails, THE system SHALL display "Login failed. Please try again." and allow immediate re-attempts without blocking the UI.

THE system SHALL use relative timestamps in user's local timezone (Asia/Seoul) for all display times (e.g., "just now", "2 minutes ago", "4 hours ago", "3 days ago")

THE system SHALL use number abbreviations for large numbers:
- 1,000 → 1k
- 10,000 → 10k
- 100,000 → 100k
- 1,000,000 → 1m
- 10,000,000 → 10m

THE system SHALL load all pages in under 2 seconds, as perceived by the user on average network conditions.

> *Developer Note: This document defines **business requirements only**. All technical implementations (architecture, APIs, database design, etc.) are at the discretion of the development team.