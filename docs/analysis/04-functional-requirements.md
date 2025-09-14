## Functional Requirements for Community BBS Platform

### Core Functionality Overview

THE Community BBS platform SHALL enable users to discover, join, and participate in topic-based sub-communities with post-and-comment functionality similar to Reddit.

THE system SHALL allow reading of all content without authentication, but require authentication for posting, commenting, voting, creating communities, joining/leaving communities, and editing/deleting personal content.

WHEN a user first visits the platform without an authenticated session, THE system SHALL display the home feed using content from all communities as if the user had joined them all.

WHEN a user has not joined any community, THE system SHALL display guidance content encouraging exploration and joining of communities, either at the top of the main feed or in the right sidebar.

WHILE a user is viewing any page in the application, THE system SHALL display a fixed left sidebar containing the Home, Explore, and Create navigation buttons, and a Recent Communities list of up to five communities sorted by most recent activity.

WHILE a user is viewing the home page, THE system SHALL display a right sidebar showing exactly ten of the most recently posted items across all communities.

WHILE a user is viewing a community home page or a post detail page, THE system SHALL display a right sidebar showing community information and rules.

### Subcommunity Creation and Management

WHEN a logged-in user clicks the Create button from the left sidebar or navigation, THE system SHALL redirect to the community creation form.

WHEN a user submits a community creation request, THE system SHALL validate the community name against the following rules:
- Name must contain only alphanumeric characters, hyphens (-), or underscores (_)
- Name must be between 1 and 64 characters long
- Name must be unique across all existing communities

IF the community name is invalid, THEN THE system SHALL display "This name isn't available. Please choose something simpler."

IF the community name is already in use, THEN THE system SHALL display "This name is already in use."

WHEN a community is successfully created, THE system SHALL add the creating user as a joined member and redirect them to the new community's home page.

WHEN a community is deleted by an administrator, THE system SHALL remove all posts, comments, and metadata associated with that community.

WHEN an administrator edits a community, THE system SHALL allow changing the description, logo, banner, and rules, but SHALL prevent modification of the community name.

WHEN a community creator attempts to edit their community, THE system SHALL enable editing of description, logo, banner, and rules, but SHALL disable editing of the community name.

WHEN a non-creator attempts to edit a community, THE system SHALL deny access and display "You can edit or delete only items you authored."

THE system SHALL display a community's logo if provided, otherwise SHALL display a default placeholder image.

THE system SHALL display a community's banner if provided, otherwise SHALL display a default placeholder image.

THE system SHALL assign a category to each community from the following predefined list: ["Tech & Programming", "Science", "Movies & TV", "Games", "Sports", "Lifestyle & Wellness", "Study & Education", "Art & Design", "Business & Finance", "News & Current Affairs"]

WHILE a community exists, THE system SHALL calculate and display the member count as the number of users who have joined the community.

WHEN a user toggles the "Join" button on a community page, THE system SHALL immediately add the user to the community's membership list.

WHEN a user toggles the "Joined" button on a community page, THE system SHALL immediately remove the user from the community's membership list.

WHEN a user joins a community, THE system SHALL immediately reflect this change in:
- The button state (switching from "Join" to "Joined")
- The main feed (including posts from this community)
- The Recent Communities list in the left sidebar (if not already present or if activity rank changes)

WHEN a user leaves a community, THE system SHALL immediately reflect this change in:
- The button state (switching from "Joined" to "Join")
- The main feed (excluding posts from this community)
- The Recent Communities list in the left sidebar (if this was one of the five most recent)

THE Recent Communities list SHALL contain up to five communities, ordered by the most recent user interaction (posting, commenting, voting, or joining) within that community.

WHEN a community has rules defined, THE system SHALL display them in the community info box on community pages and post detail pages.

WHEN displaying community rules, THE system SHALL show only the top five rules, numbered 1 through 5.

WHEN a rule exceeds 50 characters or two lines of text, THE system SHALL truncate with an ellipsis (...) after two lines.

WHEN a community has no rules defined, THE system SHALL hide the "Community Rules" section.

### Post Creation and Management

WHEN a user submits a post, THE system SHALL require selection of a target community.

IF no community is selected during post submission, THEN THE system SHALL display "Please choose a community to post in."

WHEN a post is submitted, THE system SHALL validate the title and body fields against the following rules:
- Title length must be between 5 and 120 characters
- Body length must be between 10 and 10,000 characters
- Body content must contain only plain text and line breaks; no scripts, code, or HTML allowed

IF the title is too short, THEN THE system SHALL display "Title must be at least 5 characters long."

IF the title is too long, THEN THE system SHALL display "Title must be 120 characters or fewer."

IF the body is too short, THEN THE system SHALL display "Body must be at least 10 characters long."

IF the body is too long, THEN THE system SHALL display "Body must be 10,000 characters or fewer."

IF the body contains code, scripts, or HTML elements, THEN THE system SHALL display "Scripts and code are not allowed in posts."

WHEN a post is submitted, THE system SHALL assign the author display name as follows:
- If provided, use the entered display name (max 32 characters)
- If empty, use default value "Anonymous"

WHEN a post is created, THE system SHALL record the posting user's ID and the target community ID.

WHEN a user attempts to edit a post, THE system SHALL permit editing only if the authenticated user is the original author of the post.

IF a user attempts to edit a post they did not create, THEN THE system SHALL deny the edit and display "You can edit or delete only items you authored."

WHEN a user attempts to delete a post, THE system SHALL permit deletion only if the authenticated user is the original author of the post.

IF a user attempts to delete a post they did not create, THEN THE system SHALL deny the deletion and display "You can edit or delete only items you authored."

THE system SHALL display the following fields on post cards:
- Community name (e.g., /c/ai)
- Post title
- Author display name
- Creation time (relative, e.g., "5 minutes ago")
- Comment count
- Score (upvotes minus downvotes)

WHEN a post has been deleted, THE system SHALL prevent any access to it and return a 404 error if requested directly.

WHEN a post card is displayed in any feed, THE system SHALL truncate the title and body excerpt appropriately if they exceed display limits.

### Comment System

WHEN a user submits a comment, THE system SHALL validate the content length:
- Comment must be at least 2 characters long
- Comment must be at most 2,000 characters long

IF a comment is too short, THEN THE system SHALL display "Comment must be at least 2 characters long."

IF a comment is too long, THEN THE system SHALL display "Comment must be 2,000 characters or fewer."

WHEN a user submits a comment, THE system SHALL record the comment with parent-post ID, parent-comment ID (if nested), author ID, and timestamp.

WHEN a user attempts to edit a comment, THE system SHALL permit editing only if the authenticated user is the original author of the comment.

IF a user attempts to edit a comment they did not create, THEN THE system SHALL deny the edit and display "You can edit or delete only items you authored."

WHEN a user attempts to delete a comment, THE system SHALL permit deletion only if the authenticated user is the original author of the comment.

IF a user attempts to delete a comment they did not create, THEN THE system SHALL deny the deletion and display "You can edit or delete only items you authored."

THE system SHALL support nested comment replies of any depth.

WHEN displaying comment threads, THE system SHALL indent replies to show their hierarchical relationship.

WHEN displaying comment snippets in search results, THE system SHALL show up to two lines of content followed by an ellipsis if truncated.

THE system SHALL display the following fields on comment items:
- Comment content (truncated to two lines if needed)
- Author display name
- Creation time (relative)
- Parent post title (if applicable) with link
- Community name

### Voting System

WHEN a user attempts to vote on a post or comment, THE system SHALL verify the user is not the author of the post/comment.

IF a user attempts to vote on their own post or comment, THEN THE system SHALL deny the vote and display "You can't vote on your own posts/comments."

WHEN a user has no vote on a post or comment, THE system SHALL allow switching to either "Upvote" or "Downvote".

WHEN a user clicks "Upvote" on an item they previously upvoted, THE system SHALL revert the vote to "None".

WHEN a user clicks "Downvote" on an item they previously downvoted, THE system SHALL revert the vote to "None".

WHEN a user clicks "Upvote" on an item they previously downvoted, THE system SHALL change their vote from "Downvote" to "Upvote".

WHEN a user clicks "Downvote" on an item they previously upvoted, THE system SHALL change their vote from "Upvote" to "Downvote".

WHEN a vote is registered, THE system SHALL immediately update the user interface to reflect the new vote state (optimistic UI).

THE system SHALL calculate the score for every post and comment as the total number of upvotes minus the total number of downvotes.

THE system SHALL track only one vote per user per item (post or comment).

WHEN a user's vote changes on an item, THE system SHALL immediately update the item's displayed score.

WHEN a user's vote is changed from "Upvote" to "None" or "Downvote" to "None", THE system SHALL subtract one from the item's score.

WHEN a user's vote is changed from "None" to "Upvote" or "Downvote" to "Upvote", THE system SHALL add one to the item's score.

WHEN a user's vote is changed from "None" to "Downvote" or "Upvote" to "Downvote", THE system SHALL subtract one from the item's score.

### Sorting and Pagination

WHEN the user selects "Newest" as the sort order for any main feed (Home, Community Home, Search Posts), THE system SHALL sort items by:
- Most recently created items first
- If creation times are equal, the item with the larger identifier comes first

WHEN the user selects "Top" as the sort order for any main feed (Home, Community Home, Search Posts), THE system SHALL sort items by:
- Highest score (upvotes minus downvotes) first
- If scores are equal, the most recently created item comes first
- If creation times are equal, the item with the larger identifier comes first

WHEN displaying the main feed on Home, Community Home, or Search Results (Posts tab), THE system SHALL show exactly 20 post cards per page.

WHEN the user clicks "Load more" on any main feed, THE system SHALL load and append the next 20 items according to the selected sort order.

WHEN displaying the Global Latest sidebar on the Home page, THE system SHALL show exactly 10 of the most recently posted items across all communities, with no "Load more" option.

WHEN displaying community search results, THE system SHALL show exactly 20 community cards per page.

WHEN displaying comment search results, THE system SHALL show exactly 20 comment snippets per page.

WHEN displaying search results for posts, comments, or communities, THE system SHALL show exactly 20 results per page with a "Load more" button to load the next set.

THE system SHALL use progressive loading for all main feeds: when user scrolls to bottom, "Load more" button should trigger next batch, but "Load more" button shall be visible for explicit control.

### Search Functionality

WHEN a user initiates a global search, THE system SHALL require the search query to be at least 2 characters long.

IF the search query is less than 2 characters, THEN THE system SHALL display "Please enter at least 2 characters."

WHEN searching for posts, THE system SHALL match the query against the post title and body content.

WHEN searching for sub-communities, THE system SHALL match the query against community name and description.

WHEN searching for comments, THE system SHALL match the query against comment content.

WHEN searching for posts or comments, THE system SHALL default to "Newest" sort order.

WHEN searching for sub-communities, THE system SHALL default to "Name Match" sort order.

WHEN sorting search results for sub-communities by "Name Match", THE system SHALL rank results by similarity to the query string and use creation time as a tiebreaker (newer first).

WHEN sorting search results for sub-communities by "Recently Created", THE system SHALL sort by creation date (newest first).

WHEN displaying search results for posts, THE system SHALL show the following fields:
- Community name
- Post title
- Excerpt of post body (first two lines, truncated with ellipsis if needed)
- Author display name
- Creation time (relative)
- Comment count
- Score (upvotes minus downvotes)

WHEN displaying search results for sub-communities, THE system SHALL show the following fields:
- Community name
- Description (first two lines, truncated with ellipsis if needed)
- Community logo (if available)
- "Join" or "Joined" button

WHEN displaying search results for comments, THE system SHALL show the following fields:
- Comment content (truncated to two lines with ellipsis)
- Author display name
- Creation time (relative)
- Parent post title with link
- Community name

WHEN the search returns no results, THE system SHALL display "No matching results. Try different keywords."

WHEN the search is active and the user has not entered a valid query, THE system SHALL display "Please enter at least 2 characters."

WHEN displaying search tabs (Posts, Sub-Communities, Comments), THE system SHALL initially display the Posts tab.

WHEN a user switches between search result tabs, THE system SHALL preserve the search query and reload results for the selected type.

### User Authentication and Sessions

WHEN a user attempts any action requiring authentication (posting, commenting, voting, creating community, joining/leaving community), THE system SHALL redirect to the login modal if no valid session exists.

WHEN a user is redirected to the login modal from any page, THE system SHALL pre-fill the return path so the user can resume their original action after successful login.

WHEN the user logs in successfully, THE system SHALL restore the previous page and re-attempt the denied action.

WHEN a user logs out, THE system SHALL terminate their session and display a clean guest experience.

WHEN a user session expires, THE system SHALL detect the expiration on the next server request and gently prompt re-login without disrupting the UI.

WHEN a user attempts to authenticate with invalid credentials, THE system SHALL display "Login failed. Please try again."

WHEN a user enters their credentials and clicks "Sign in", THE system SHALL validate the format and existance of the identifier and password.

WHEN a user clicks "Sign up", THE system SHALL create a new account with the provided credentials and authenticate the user immediately.

WHEN a guest attempts to access any function requiring authentication, THE system SHALL block the action and display "Please sign in to continue."

WHEN a user attempts to vote on a post or comment, THE system SHALL verify the user's own post/comment ID does not match the target item's author ID.

WHEN the service is first accessed without session data, THE system SHALL assign a guest identity and allow full read access.

WHEN a guest user attempts to access any write or join function, THE system SHALL immediately display the login modal with appropriate context.

THE system SHALL maintain a generous session duration (minimum 30 days inactive before expiry).

THE system SHALL support login using either username or email address as the identifier.

THE system SHALL allow users to recover sessions after expiration without requiring re-registration.

WHEN the login modal appears, THE system SHALL display input fields for identifier and password, and buttons for "Sign in" and "Sign up".

WHEN the login modal is dismissed, THE system SHALL preserve all form state for resumption.

The system SHALL NOT display login errors after multiple failed attempts in a way that freezes UI or forces refresh.

WHEN a user is successfully logged in, THE system SHALL immediately update the navigation to show the profile dropdown and hide login/signup options.

THE system SHALL ensure users cannot initiate multiple concurrent authentication flows.