## Error Handling Requirements for Community Platform

### Error Handling Philosophy

The system must prioritize smooth, uninterrupted user experiences. Every error condition must be presented as a clear, friendly, and actionable message that guides the user toward resolution without disrupting their workflow. All errors must be recoverable — the user must always be able to return to their previous task after resolving the error. Error handling is not an afterthought; it is a core component of user experience design. The platform must never freeze, crash, or display technical jargon. Users must always understand what went wrong and how to fix it.

All login prompts, validation errors, permission denials, and system errors must follow the exact standardized message text provided in the requirements. Consistency in messaging is critical to building user trust and reducing cognitive load. Recovery paths must be immediate, predictable, and intuitive.

### Login Required Errors

WHEN a user attempts to create a post, comment, vote, join a community, leave a community, or create a sub-community while not logged in, THEN THE system SHALL display the message: "Please sign in to continue."

WHEN the system displays the "Please sign in to continue." message, THEN THE system SHALL pause the initiated action and show a modal login interface overlaying the current screen.

WHEN the user successfully logs in after being prompted, THEN THE system SHALL resume the original action as if it had been initiated with a valid session.

WHEN the user cancels the login attempt, THEN THE system SHALL return to the original screen with the action still disabled and the login message still visible.

WHILE the login modal is open, THE system SHALL prevent any other UI interactions except those within the modal.

### Permission Denied Errors

IF a user attempts to edit or delete a post or comment they did not author, THEN THE system SHALL display the message: "You can edit or delete only items you authored."

IF a user attempts to edit a sub-community where they are not the creator, THEN THE system SHALL display the message: "You can edit or delete only items you authored."

WHEN the "You can edit or delete only items you authored." message is displayed, THEN THE system SHALL immediately hide or disable the edit and delete buttons for that item.

WHEN a user attempts to vote on their own post or comment, THEN THE system SHALL display the message: "You can't vote on your own posts/comments."

WHEN the "You can't vote on your own posts/comments." message is displayed, THEN THE system SHALL prevent the user from toggling the vote button and visually disable it.

IF a user attempts to create a sub-community without an active account, THEN THE system SHALL trigger the "Login Required Errors" flow instead of showing a permission-denied message.

### Validation Errors

WHEN a user attempts to create a sub-community with a name that contains special characters other than hyphen (-) or underscore (_), THEN THE system SHALL display the message: "This name isn't available. Please choose something simpler."

WHEN a user attempts to create a sub-community with a name that is already in use, THEN THE system SHALL display the message: "This name is already in use."

WHEN a user attempts to create a post with a title fewer than 5 characters or longer than 120 characters, THEN THE system SHALL display the message: "Title must be between 5 and 120 characters."

WHEN a user attempts to create a post with a body fewer than 10 characters or longer than 10,000 characters, THEN THE system SHALL display the message: "Body must be between 10 and 10,000 characters."

WHEN a user attempts to create a comment with fewer than 2 characters or longer than 2,000 characters, THEN THE system SHALL display the message: "Comment must be between 2 and 2,000 characters."

WHEN a user attempts to display an author display name longer than 32 characters, THEN THE system SHALL truncate the name to 32 characters and proceed without error.

WHEN a user performs a search query with fewer than 2 characters, THEN THE system SHALL display the message: "Please enter at least 2 characters."

WHEN a user attempts to submit a post without selecting a sub-community, THEN THE system SHALL display the message: "Please choose a community to post in."

WHEN any validation error is displayed, THEN THE system SHALL prevent form submission and highlight the invalid field(s) visually, maintaining all other input values.

### System Errors

WHEN a temporary server failure, network interruption, or unexpected database error occurs during any user-initiated request, THEN THE system SHALL display the message: "A temporary error occurred. Please try again in a moment."

WHEN the system displays the "A temporary error occurred. Please try again in a moment." message, THEN THE system SHALL preserve the user’s state (e.g., draft text, scroll position, selected community) and enable retry functionality through a prominent "Try again" button.

WHEN a retry attempt fails again after three attempts, THEN THE system SHALL display the same message and disable further retry attempts for 30 seconds, with a visible countdown.

WHILE the retry countdown is active, THE system SHALL NOT allow new action attempts on the same interface.

IF a system error occurs during the creation of a sub-community or post, THEN THE system SHALL keep all form data intact and preserve validation state for manual submission retry.

### Session Expiry Handling

WHILE any authenticated user is active on any page, AND their authentication token expires, THEN THE system SHALL silently attempt to refresh the token in the background.

IF the token refresh fails, THEN THE system SHALL display a non-intrusive banner or toast notification: "Your session has expired. Please sign in to continue."

WHEN the user clicks the "sign in" link in the session expiry notification, THEN THE system SHALL open the login modal.

WHEN the user successfully logs in after a session expiry, THEN THE system SHALL restore the previous context (page, scroll position, active elements) and resume the prior action.

WHEN the session expires and the user has not interacted with the page for over 10 minutes, THEN THE system SHALL auto-revoke the session without prompting.

IF an action is initiated while the user's session is expired (e.g., clicking "Post"), THEN THE system SHALL immediately show the login modal without displaying a separate expiry message first — this behavior overrides the banner notification.

### Standard Messages Glossary

The following messages must be used verbatim in all user interfaces, as specified in the product requirements. No synonyms, abbreviations, or variations are permitted.

- "Please sign in to continue." — Used for all login-required actions
- "You can edit or delete only items you authored." — Used for unauthorized edit/delete attempts
- "This name is already in use." — Used for duplicate community name submissions
- "This name isn't available. Please choose something simpler." — Used for invalid community name format
- "Please choose a community to post in." — Used when no community is selected before posting
- "Please enter at least 2 characters." — Used for search queries under 2 characters
- "You can't vote on your own posts/comments." — Used for self-vote attempts
- "A temporary error occurred. Please try again in a moment." — Used for system/infrastructure failures

These messages must be rendered using the exact case, punctuation, and spacing as provided. No localization or translation is required, as the platform does not support multiple languages.

All other error messages not listed above are strictly prohibited. The system must never invent new messages, modify existing ones, or add additional context unless explicitly documented.

These messages should be rendered with consistent UI styling: as centered, top-aligned, or toast-style notifications depending on context. The important requirement is that the wording is exact, and the response to the error is predictable and recoverable.

> *Developer Note: This document defines **business requirements only**. All technical implementations (architecture, APIs, database design, etc.) are at the discretion of the development team.