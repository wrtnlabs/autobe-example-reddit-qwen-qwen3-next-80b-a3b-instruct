## User Journey: Comment Interaction

### User Persona

- **Name**: Active Community Member
- **Profile**: Authenticated user who regularly participates in discussions across multiple sub-communities
- **Behavior**: Engages with content daily, replies to insightful comments, follows threads, and occasionally edits their own comments for clarity
- **Goals**: Contribute to meaningful discussions, gain visibility through well-received replies, maintain ownership of their contributions, and participate in threaded conversations without friction
- **Frustrations**: Unclear editing permissions, inability to track reply chains, delayed feedback on comment actions

### Goal Statement

The user shall be able to participate in threaded comment conversations by creating, replying to, editing, and deleting their own comments on any post within communities they have access to, with immediate visual feedback and strict ownership enforcement.

### Pre-conditions

- The user has an active, authenticated session (i.e., not a guest)
- The user is viewing a post detail page (`/c/[name]/[postID]`)
- The post has one or more existing comments, or is empty
- The user has not already commented on this post (optional, but relevant to reply behavior)
- The comment system is fully loaded and responsive

### Main Success Scenario

1. **The user locates the comment composer** at the bottom of the comment list in the main content area.
2. **The user types a comment** of 2–2,000 characters of plain text, including line breaks as needed.
3. **The user selects a target comment to reply to** (optional):
   - IF the user clicks the "Reply" button on an existing comment, the composer automatically nests the new comment under the selected one and displays a visual hierarchy (e.g., inset or indentation).
   - IF the user clicks "Comment" at the top of the list or does not select any reply target, the comment is posted as a top-level comment.
4. **The user submits the comment** by clicking the "Post" button.
5. **THE system SHALL immediately display the new comment** in the UI with:
   - Author display name (or "Anonymous" if not set)
   - Relative timestamp (e.g., "just now")
   - Vote buttons (Up/Down)
   - "Edit" and "Delete" buttons visible only to the current user
   - Reply button available to all authenticated users
   - Visual nesting (if replying to a nested comment)
6. **THE system SHALL update the parent comment’s reply count** in real-time (+1), even if the comment is nested multiple levels deep.
7. **THE system SHALL synchronize the new comment with the server** in the background and handle any failure by:
   - Preserving the locally displayed comment
   - Showing a retry indicator (e.g., pulsing "Posted" banner)
   - Allowing the user to manually retry if sync fails
8. **THE system SHALL ensure that all comments are ordered by creation time within their thread**, following:
   - NEWEST first at the top of each thread
   - If comments have identical creation time, the comment with a higher identifier (created later) appears first
9. **WHEN the user edits a comment they authored**, THE system SHALL:
   - Display an editable text field with the original content pre-filled
   - Allow the user to modify up to 2,000 characters
   - Preserve line breaks and plain text
   - Hide "Delete" button during edit mode
   - Show "Save" and "Cancel" buttons
10. **WHEN the user clicks "Save"**, THE system SHALL:
    - Immediately update the display with the edited text
    - Update the comment’s "last edited" timestamp (displayed as "edited X min ago")
    - Send an update request to the server
    - If the update fails, preserve the local edit and show a retry prompt
11. **WHEN the user clicks "Delete"** on a comment they authored, THE system SHALL:
    - Immediately remove the comment from the UI
    - Decrease the reply count of its parent comment (if any)
    - Send a deletion request to the server
    - If deletion fails, restore the comment in the UI and show a retry indicator

### Alternative Scenarios

#### A1: Comment Length Violation

- IF the user types more than 2,000 characters in the comment composer, THEN THE system SHALL:
  - Disable the "Post" button
  - Show a red counter (e.g., "2050/2000")
  - Prevent submission until the text is reduced below 2,000 characters

#### A2: Blank Comment Submission

- IF the user clicks "Post" with 0 characters or only whitespace, THEN THE system SHALL:
  - Prevent submission
  - Show a tooltip: "Your comment can't be empty. Add some text."
  - Keep the composer open and focused

#### A3: Nested Reply Depth Limit

- WHILE the comment system is displaying reply threads, THE system SHALL limit nesting to a maximum of **5 levels deep**.
- IF the user tries to reply to a comment that is already at depth 5, THEN THE system SHALL:
  - Disable the "Reply" button on that comment
  - Show tooltip: "Replies are limited to 5 levels deep."
  - Allow replies only to comments at depth 4 or shallower

#### A4: Editing Another User’s Comment

- IF the user clicks "Edit" on a comment authored by someone else, THEN THE system SHALL:
  - Immediately show a modal with message: "You can edit or delete only items you authored."
  - Keep the comment unmodified
  - Return focus to the comment list

#### A5: Deleting Another User’s Comment

- IF the user clicks "Delete" on a comment authored by someone else, THEN THE system SHALL:
  - Immediately show a modal with message: "You can edit or delete only items you authored."
  - Keep the comment unchanged
  - Return focus to the comment list

#### A6: Session Expires During Comment Interaction

- WHILE the user is composing or editing a comment, IF the JWT session expires:
  - THEN THE system SHALL:
    - Display a light modal overlay: "Please sign in to continue."
    - Disable the "Post", "Save", or "Delete" buttons
    - Preserve the unsaved comment text in local memory
    - Allow the user to initiate login
  - WHEN the user successfully logs in:
    - THE system SHALL restore the comment text to the composer
    - Re-enable all comment action buttons
    - Resume the original action (post/save/delete)

#### A7: Comment Search Triggered

- IF the user performs a global search (`/s`) and selects the "Comments" tab:
  - THEN THE system SHALL:
    - Return comment snippets sorted by "Newest" only
    - Display each result as:
      - Comment content (max 2 lines, truncated with ellipsis)
      - Author name
      - Relative timestamp
      - Parent post title (clickable link)
      - Community name
    - Show "Load more" to fetch next 20 results
    - If no results, display: "No matching results. Try different keywords."

#### A8: Comment Visibility on Home Feed

- IF the comment is linked from a post that appears in the Home feed (e.g., from "Global Latest" sidebar):
  - THEN THE system SHALL NOT display comments inline in the Home feed card
  - Instead, THE system SHALL include only:
    - Comment count
    - Score (upvotes - downvotes) of the parent post
  - Full comments are only viewable on the post detail page (`/c/[name]/[postID]`)

### Post-action Outcomes

1. **Positive Outcome**: The comment is successfully posted, edited, or deleted, with immediate visual feedback. The user gains confidence in their ability to participate and influence conversations.
2. **Persistence**: Even if the server fails to synchronize, the user’s input is preserved locally and can be retried, ensuring no loss of work.
3. **Ownership Reinforcement**: The "Edit" and "Delete" buttons are only shown when appropriate, reinforcing the business rule that users own their content.
4. **Thread Integrity**: Nested replies remain properly organized, aiding readability, and reply counts are always accurate.
5. **Experience Consistency**: All comment interactions follow the same pattern as voting and joining: optimistic UI updates, server sync in background, and graceful error recovery.
6. **Discovery Enabled**: Searchable comments increase content discoverability, allowing users to find relevant discussions even outside their joined communities.
7. **No Self-Reference**: Comments cannot be voted on by their own author — this rule is enforced both in UI (voting buttons grayed out) and backend.

### Business Rules Summary (EARS Format)

- THE system SHALL allow only authenticated users to create, edit, or delete comments.
- WHEN a comment is submitted, THE system SHALL validate that its length is between 2 and 2,000 characters.
- WHILE a user is editing a comment they authored, THE system SHALL allow changes to the text content but prevent editing of any other comment.
- IF a user attempts to edit or delete a comment not authored by them, THEN THE system SHALL display "You can edit or delete only items you authored."
- WHERE a comment is posted as a reply to another comment, THE system SHALL visually nest it one level deeper and increment the parent’s reply count.
- IF the maximum comment nesting depth (5 levels) is reached, THEN THE system SHALL disable "Reply" buttons on all comments at depth 5.
- WHEN session expires during comment interaction, THE system SHALL pause all editing actions, preserve local draft, and resume full functionality after successful re-authentication.
- THE system SHALL store and display the relative timestamp of each comment in the user’s local timezone (Asia/Seoul), using format such as "just now", "X minutes ago", or "X days ago".
- THE system SHALL prevent users from upvoting or downvoting their own comments.
- WHERE the global search is executed with "Comments" selected, THE system SHALL return comments sorted exclusively by "Newest", and display 20 items per page.
- THE system SHALL never display comment content in the Home feed or Global Latest sidebar — only the comment count is included.

### Behavior Constraints

- **Text Formatting**: All comments must be plain text only — HTML, markdown, script tags, or code blocks are prohibited and stripped during submission.
- **Whitespaces**: Trailing/leading whitespace in comment text is preserved in display but ignored for length calculation (i.e., "   " counts as 0 valid characters).
- **Replies**: A comment can have multiple direct replies, but each reply thread is linear and independent. No "side-thread" branching is allowed.
- **Vote System**: Comment votes are independent of post votes — a comment’s score is calculated separately as (upvotes − downvotes) and does not affect the parent post’s score.
- **Deletion**: Deleting a comment also deletes all replies nested under it (cascade delete).
- **Updates**: Editing a comment does not change its creation timestamp — only the "last edited" timestamp is updated.

### Ui Optimism and Sync

- All comment creation, editing, and deletion are treated as optisimistic actions:
  - UI updates occur immediately upon user action
  - Server sync occurs in background with separate HTTP request
  - If sync fails, UI state is preserved and retry mechanism is exposed (e.g., "Retry" button)
- This ensures the experience remains responsive and smooth, even under poor network conditions.

> *Developer Note: This document defines **business requirements only**. All technical implementations (architecture, APIs, database design, etc.) are at the discretion of the development team.*