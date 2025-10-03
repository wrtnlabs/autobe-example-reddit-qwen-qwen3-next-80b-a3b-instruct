## Authentication System Overview

The communityPlatform system enforces a strict role-based access control model that distinguishes between authenticated and unauthenticated users. All system operations are governed by user role permissions, which are enforced at the application layer based on session authentication tokens (JWT). The system operates on three distinct user roles: guest, member, and admin. Authentication is handled through a modal login interface that persists temporarily when sessions expire, allowing seamless restoration of interrupted user flows. Upon successful login, a JWT is issued with a 30-minute expiration for access and a 30-day expiration for refresh tokens. Both tokens are stored client-side in localStorage for convenient access during interactive sessions. The JWT payload includes the user's ID, role, and a permissions array for rapid authorization decisions. All operations require server-side validation of the JWT signature and expiration before any business logic is processed.

## Guest Role Permissions

Guests are unauthenticated users who can view all public content without restriction.

WHEN a user accesses the platform without a valid authentication token, THE system SHALL grant access as a guest.

WHEN a guest views the home feed, THE system SHALL display all posts from all communities based on the selected sort order (Newest or Top).

WHEN a guest searches for content, THE system SHALL return search results for posts, communities, and comments.

WHEN a guest attempts to access any action requiring authentication, THE system SHALL display "Please sign in to continue." and prevent the action from proceeding.

WHEN a guest attempts to create a community, THE system SHALL deny access and display "Please sign in to continue."

WHEN a guest attempts to join or leave a community, THE system SHALL deny access and display "Please sign in to continue."

WHEN a guest attempts to create a post, THE system SHALL deny access and display "Please sign in to continue."

WHEN a guest attempts to post a comment, THE system SHALL deny access and display "Please sign in to continue."

WHEN a guest attempts to upvote or downvote any content, THE system SHALL deny access and display "Please sign in to continue."

WHEN a guest attempts to edit or delete any post or comment, THE system SHALL hide edit/delete controls and display "You can edit or delete only items you authored."

WHEN a guest visits a community page, THE system SHALL display the community's rules and description without the "Join" button.

## Member Role Permissions

Members are authenticated users who have created an account and successfully logged in. Members can participate actively in the community by creating content, engaging with others, and managing personal community membership.

WHEN a user successfully logs in, THE system SHALL elevate their permissions to member role.

WHEN a member views their home feed, THE system SHALL display posts only from communities they have joined, sorted by the selected criteria (Newest or Top).

WHEN a member attempts to join a community, THE system SHALL update their member profile to include that community in their joined communities list and immediately reflect this change in the home feed and Recent Communities list.

WHEN a member attempts to leave a community, THE system SHALL remove that community from their joined communities list and immediately remove its posts from their home feed while retaining its appearance in Recent Communities if it was last active within the top 5 positions.

WHEN a member creates a post, THE system SHALL associate the post with their user ID and store the optional author display name they provided, defaulting to "Anonymous" if none was specified.

WHEN a member attempts to edit their own post, THE system SHALL allow modification of the title and body within character limits (title: 5-120, body: 10-10,000) and preserve the community association.

WHEN a member attempts to delete their own post, THE system SHALL remove the post and all associated comments, and update community post counts accordingly.

WHEN a member creates a comment, THE system SHALL associate the comment with their user ID and store it in the thread, respecting the 2-2,000 character limit.

WHEN a member attempts to update their own comment, THE system SHALL permit edits within the character limit and track version history if implemented in the future.

WHEN a member attempts to delete their own comment, THE system SHALL remove the comment and update the parent post's comment count.

WHEN a member upvotes or downvotes a post or comment, THE system SHALL not allow voting on their own content and shall update the score immediately in the UI before syncing with the server.

WHEN a member clicks the same vote button a second time, THE system SHALL revert their vote state to "None" and update the score accordingly.

WHEN a member attempts to vote on their own content, THE system SHALL display "You can't vote on your own posts/comments." and prevent the vote from being registered.

WHEN a member creates a community, THE system SHALL validate the community name for uniqueness and adherence to format rules (alphanumeric with hyphens and underscores only), then create the community with the provided metadata, setting the member as the creator.

WHEN a member edits a community they created, THE system SHALL permit changes to the description, logo, banner, and rules, but SHALL prevent any modification to the immutable community name.

## Admin Role Permissions

Admins are privileged members with full system oversight capabilities. Administrators can moderate content, manage communities, and handle user reports.

WHEN a user is granted admin privileges by system configuration, THE system SHALL enable additional permissions beyond those of the member role.

WHEN an admin deletes a community, THE system SHALL remove all associated posts and comments and update user joined community lists where applicable.

WHEN an admin attempts to edit any post or comment regardless of authorship, THE system SHALL permit modification or deletion of any content.

WHEN an admin attempts to delete any user's post or comment, THE system SHALL allow immediate removal and bypass ownership restrictions.

WHEN an admin joins or leaves a community, THE system SHALL update their membership status per normal member procedures, but SHALL ignore any restrictions based on the creator status of the community.

WHEN an admin upvotes or downvotes any content, THE system SHALL permit voting on items authored by themselves without restriction.

WHEN an admin attempts to view a community with excessive reported content or flagrant rule violations, THE system SHALL provide additional moderation controls not visible to members.

## Permission Matrix Summary

| Action | Guest | Member | Admin |
|--------|-------|--------|-------|
| View Home Feed | ✅ | ✅ | ✅ |
| View Global Latest (sidebar) | ✅ | ✅ | ✅ |
| View Community Pages | ✅ | ✅ | ✅ |
| View Post Details | ✅ | ✅ | ✅ |
| View Search Results | ✅ | ✅ | ✅ |
| Create Community | ❌ | ✅ | ✅ |
| Edit Community (Title/Description/Logo/Rules) | ❌ | ✅ (Own only) | ✅ (Any) |
| Delete Community | ❌ | ❌ | ✅ |
| Join Community | ❌ | ✅ | ✅ |
| Leave Community | ❌ | ✅ | ✅ |
| Create Post | ❌ | ✅ | ✅ |
| Edit Post | ❌ | ✅ (Own only) | ✅ (Any) |
| Delete Post | ❌ | ✅ (Own only) | ✅ (Any) |
| Comment on Post | ❌ | ✅ | ✅ |
| Edit Comment | ❌ | ✅ (Own only) | ✅ (Any) |
| Delete Comment | ❌ | ✅ (Own only) | ✅ (Any) |
| Upvote Content | ❌ | ✅ | ✅ |
| Downvote Content | ❌ | ✅ | ✅ |
| Vote on Own Content | ❌ | ❌ | ✅ |
| Toggle Vote State | ❌ | ✅ | ✅ |
| View Recent Communities | ❌ | ✅ | ✅ |
| Access Global Search | ✅ | ✅ | ✅ |
| Access Create Post | ❌ | ✅ | ✅ |
| Access Community Creation | ❌ | ✅ | ✅ |

> *Developer Note: This document defines **business requirements only**. All technical implementations (architecture, APIs, database design, etc.) are at the discretion of the development team.*