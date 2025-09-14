## User Roles and Permissions

This document defines the authentication and authorization structure for the Community BBS platform. It specifies the permission levels and operational boundaries for each user role, ensuring that all functional requirements are enforced consistently across the application. The system relies on three distinct user roles: guest, member, and administrator.

### Role Summary

The system enforces a clear three-tiered role hierarchy based on user authentication status and responsibilities:

- **Guest**: Unauthenticated users who can browse content but cannot interact.
- **Member**: Authenticated users who can create, modify, and manage their own content, join communities, and vote.
- **Administrator**: System-level users with full control over communities, content moderation, and user management.

All interactions with the system are governed by these roles. Permissions are strictly enforced on the server side, and no client-side logic should be trusted for authorization decisions.

### Guest Access

Guests are users who have not logged in. They are granted read-only access to all public content. Guests cannot perform any action that modifies the system state or user data.

#### Guest Allowed Actions

- View publicly accessible posts from any sub-community
- View publicly accessible sub-community pages (including descriptions, rules, and member counts)
- View global latest posts in the right sidebar
- Browse communities in the Explore section
- Search for posts, communities, and comments using the global search
- View comment threads and post details

#### Guest Prohibited Actions

THE system SHALL deny access to all actions requiring authentication. Specifically:

WHEN a guest attempts to create a post, THE system SHALL deny the request and display: "Please sign in to continue."
WHEN a guest attempts to comment on a post, THE system SHALL deny the request and display: "Please sign in to continue."
WHEN a guest attempts to upvote or downvote a post or comment, THE system SHALL deny the request and display: "Please sign in to continue."
WHEN a guest attempts to join a sub-community, THE system SHALL deny the request and display: "Please sign in to continue."
WHEN a guest attempts to leave a sub-community, THE system SHALL deny the request and display: "Please sign in to continue."
WHEN a guest attempts to create a new sub-community, THE system SHALL deny the request and display: "Please sign in to continue."
WHEN a guest attempts to edit or delete any post or comment, THE system SHALL deny the request and display: "Please sign in to continue."
WHEN a guest attempts to navigate to /submit, /c/create, or any /c/[name]/submit endpoint, THE system SHALL automatically redirect to /login and display: "Please sign in to continue."

WHEN a guest views their own post or comment in search results or feeds, THE system SHALL NOT display Edit/Delete buttons.

### Member Access

Members are authenticated users who have successfully logged in. Members can interact with the platform by creating, modifying, and participating in community content, subject to ownership constraints.

#### Member Allowed Actions

- View all publicly accessible content (same as guest)
- Create new posts in any sub-community (does not require membership in the target community)
- Edit or delete posts that they authored
- Comment on any post
- Edit or delete comments that they authored
- Upvote or downvote any post or comment (except their own)
- Join or leave any sub-community
- View their own profile and activity history
- Search for posts, communities, and comments with full functionality
- Use the post composer on any community page or global /submit endpoint

#### Member Prohibited Actions

THE system SHALL prevent members from performing actions outside their ownership or permissions. Specifically:

IF a member attempts to edit or delete a post or comment authored by another user, THEN THE system SHALL deny the request and display: "You can edit or delete only items you authored."
IF a member attempts to upvote or downvote their own post or comment, THEN THE system SHALL deny the request and display: "You can't vote on your own posts/comments."
IF a member attempts to edit a sub-community's name, description, logo, banner, or rules when they are not the creator, THEN THE system SHALL deny the request and display: "You can edit or delete only items you authored."

WHILE a member has joined a sub-community, THE system SHALL include posts from that community in their Home feed.
WHILE a member has left a sub-community, THE system SHALL exclude posts from that community from their Home feed.
WHEN a member toggles the "Join" / "Joined" button on a community page, THE system SHALL immediately update their Home feed, the Recent Communities list, and the button state.
WHEN a member joins a sub-community for the first time, THE system SHALL add that community to the Recent Communities list (up to 5 entries, ordered by most recent activity).
WHEN a member leaves a sub-community, THE system SHALL remove that community from the Recent Communities list.

### Administrator Access

Administrators are system-level users with elevated privileges to manage content, communities, and user behavior. Administrators are distinct from community creators.

#### Administrator Allowed Actions

- All actions permitted to members
- Create, edit, or delete any sub-community regardless of ownership
- Edit any sub-community’s name, description, logo, banner, or rules (override creator restrictions)
- Delete any post or comment on the platform
- Ban or suspend users from the platform
- Delete communities and purge all associated posts and comments
- View system analytics and user activity reports
- Override community rules or community-imposed restrictions (e.g., post approval requirements)
- Monitor content flagged by users

#### Administrator Prohibited Actions

IF an administrator attempts to delete their own account, THEN THE system SHALL prevent deletion and display: "Administrative accounts cannot be deleted."

WHEN an administrator deletes a sub-community, THE system SHALL automatically delete all posts, comments, and related voting data belonging to that community.

WHEN an administrator edits a sub-community’s rules, THE system SHALL update the display immediately in all community home pages and post detail pages.

WHEN an administrator edits a sub-community’s name, THE system SHALL preserve all existing links to /c/[old-name] and redirect them to /c/[new-name].

### Authentication Requirements

The system implements a persistent session mechanism for authenticated users. Authentication is required for all non-view actions.

WHEN a user logs in successfully, THE system SHALL establish a session and retain it to support uninterrupted user experience.
WHEN a user session expires mid-action, THE system SHALL detect the invalidation and prompt re-login without navigating away from the current screen.
WHEN a user re-authenticates after session expiry, THE system SHALL resume the prior action (e.g., submitting a post, voting, joining a community).

WHEN a guest attempts to perform any authentication-requiring action, THE system SHALL display a login modal overlaying the current page.
WHEN a user completes login in the modal, THE system SHALL return to the original page and complete the original intended action.

THE system SHALL NOT require users to re-authenticate for each new page load unless the session has genuinely expired.

### Permission Matrix

The following table summarizes the permissions granted to each role for each system function:

| Action | Guest | Member | Administrator |
|--------|-------|--------|---------------|
| View homepage feed | ✅ | ✅ | ✅ |
| View global latest posts | ✅ | ✅ | ✅ |
| View community pages | ✅ | ✅ | ✅ |
| View post details | ✅ | ✅ | ✅ |
| View comments | ✅ | ✅ | ✅ |
| Search posts | ✅ | ✅ | ✅ |
| Search communities | ✅ | ✅ | ✅ |
| Search comments | ✅ | ✅ | ✅ |
| Join a community | ❌ | ✅ | ✅ |
| Leave a community | ❌ | ✅ | ✅ |
| Create a community | ❌ | ✅ | ✅ |
| Edit own post | ❌ | ✅ | ✅ |
| Delete own post | ❌ | ✅ | ✅ |
| Edit any post | ❌ | ❌ | ✅ |
| Delete any post | ❌ | ❌ | ✅ |
| Comment on a post | ❌ | ✅ | ✅ |
| Edit own comment | ❌ | ✅ | ✅ |
| Delete own comment | ❌ | ✅ | ✅ |
| Edit any comment | ❌ | ❌ | ✅ |
| Delete any comment | ❌ | ❌ | ✅ |
| Upvote a post | ❌ | ✅ | ✅ |
| Downvote a post | ❌ | ✅ | ✅ |
| Upvote a comment | ❌ | ✅ | ✅ |
| Downvote a comment | ❌ | ✅ | ✅ |
| Edit sub-community name | ❌ | ❌ | ✅ |
| Edit sub-community description | ❌ | ✅ (only if creator) | ✅ |
| Edit sub-community logo/banner | ❌ | ✅ (only if creator) | ✅ |
| Edit sub-community rules | ❌ | ✅ (only if creator) | ✅ |
| Delete sub-community | ❌ | ❌ | ✅ |
| Vote on own content | ❌ | ❌ | ❌ |

This matrix is definitive and must be implemented in server-side authorization logic. Client-side interface elements (e.g., hiding Edit buttons) may be used for UX polish, but server-side enforcement is mandatory and primary.

> *Developer Note: This document defines **business requirements only**. All technical implementations (architecture, APIs, database design, etc.) are at the discretion of the development team.