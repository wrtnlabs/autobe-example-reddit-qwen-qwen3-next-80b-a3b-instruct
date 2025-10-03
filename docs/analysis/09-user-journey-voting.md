# User Journey: Voting System Interaction

### User Persona

**Member (Authenticated User)**

A registered member of the community platform who engages with content daily by reading posts and comments, and actively contributes to community consensus by upvoting or downvoting content they find valuable or misleading. This user understands that their votes influence content visibility and are part of a collaborative knowledge-weighting system. They expect immediate, visible feedback on their actions and clarity when actions are restricted.

**Guest (Unauthenticated User)**

A visitor to the platform who reads content but has not signed in. They may be considering joining the community and observe voting behavior as a signal of content quality. They encounter system prompts when attempting to interact and are guided toward registration.

**Admin (System Moderator)**

An elevated user who can override content restrictions, delete inappropriate items, and manage communities. Admins possess the same voting privileges as members but may vote on content they did not create even if they are the author of another item — they are treated like any other member for voting purposes unless otherwise governed by moderation overrides.

### Goal Statement

Users should be able to express their opinion on any post or comment with a single, intuitive action (clicking Upvote or Downvote), experience immediate visual feedback, and understand why they cannot vote in certain situations — all within a seamless, frictionless flow that preserves their current context.

### Pre-conditions

- The user is viewing a post or comment item in any page context: Home feed, Community Home, Post Detail, or Search results.
- The item has an active upvote/downvote interface (visible buttons: ▲ for upvote, ▼ for downvote).
- The user’s session state is either active or expired (will be handled by recovery flow).
- The user is either a guest or a member, as defined by 01-user-roles.md.
- The user is not attempting to vote on their own content.
- Content exists and has not been removed.

### Main Success Scenario

**Scenario: Member Upvotes a Post**

1. The member views a post in the Home feed authored by another user.
2. The member clicks the ▲ (Upvote) button.
3. THE system SHALL immediately (optimistically) update the UI:
   - The ▲ button changes color to indicate "upvoted" state (e.g., blue fill).
   - The ▼ button becomes unhighlighted.
   - The score indicator increases by 1 (e.g., from "2" to "3").
   - The vote count tooltip or badge refreshes visually without page reload.
4. Meanwhile, the system sends a vote registration request to the backend.
5. THE system SHALL validate:
   - The user is not the author of the post (via ownership check).
   - The vote state transition is permitted (None → Upvote).
6. IF validation passes, THE system SHALL:
   - Persist the upvote in the backend database.
   - Return a 200 OK response.
   - Lock the vote state for this user on this item until changed.
7. THE system SHALL maintain consistent UI state matching backend state.
8. IF the vote succeeds, the member feels validated: their input had immediate global effect.

**Scenario: Member Toggles from Upvote to Downvote**

1. The member has previously upvoted a comment.
2. The member clicks the ▼ (Downvote) button.
3. THE system SHALL immediately update the UI:
   - The ▲ button returns to neutral state (empty outline).
   - The ▼ button changes to "downvoted" state (e.g., red fill).
   - The score indicator decreases by 2 (e.g., from "5" to "3", since it removes +1 and adds -1).
4. THE system SHALL send a vote update request (Upvote → Downvote).
5. IF the backend accepts the transition, THE system SHALL update the vote record to reflect the new state.

**Scenario: Member Reverses Vote to None**

1. The member has upvoted a post and wishes to remove their vote.
2. The member clicks the ▲ (Upvote) button again.
3. THE system SHALL immediately update the UI:
   - The ▲ button returns to neutral (empty outline).
   - The ▼ button remains neutral (empty outline).
   - The score indicator decreases by 1 (e.g., from "4" to "3").
4. THE system SHALL send a vote removal request (Upvote → None).
5. IF the backend accepts, THE system SHALL clear the user’s vote record for that item.

### Alternative Scenarios

**Scenario: Guest Attempts to Vote**

1. A guest user clicks ▲ on a post.
2. THE system SHALL immediately halt the action.
3. THE system SHALL display a modal overlay: "Please sign in to continue."
4. The modal contains:
   - Login form (email/username + password)
   - "Sign up" option
5. IF the guest logs in successfully:
   - THE system SHALL resume the original voting action without requiring the user to navigate back.
   - The vote is submitted as if initiated after login.
6. IF the guest closes the modal:
   - THE system SHALL return the UI to its pre-click state.
   - The vote UI remains unchanged.

**Scenario: Member Attempts to Vote on Own Post**

1. A member views their own post.
2. The member clicks ▲ or ▼.
3. THE system SHALL:
   - Immediately prevent the action.
   - Display an inline message below the vote buttons: "You can’t vote on your own posts/comments."
   - Keep the vote buttons unchanged (no state transition).
4. THE system SHALL NOT send a request to the backend.
5. No server-side validation occurs — the restriction is enforced client-side as a UX best practice.

**Scenario: Member Clicks Upvote, Then Downvote, Then Upvote Again (Cycle)**

1. Member starts with No vote (score = 0).
2. Member clicks ▲ → score becomes +1. Vote state = Upvote.
3. Member clicks ▼ → score becomes -1. Vote state = Downvote.
4. Member clicks ▲ → score becomes +1. Vote state = Upvote.
5. THE system SHALL permit this cycle indefinitely.
6. Each click SHALL trigger optimistic UI update.
7. Each change SHALL trigger one backend update request.

**Scenario: Session Expires During Voting Attempt**

1. Member has been inactive for 30 days (session expired).
2. Member clicks ▲ on a post.
3. THE system SHALL:
   - Detect invalid or expired JWT.
   - Hide any pending vote state.
   - Display the login modal with message: "Your session has expired. Please log in to continue."
4. IF member logs in successfully:
   - THE system SHALL reinstate the voting intention.
   - THE system SHALL send the vote action immediately after authentication.
5. IF member cancels login:
   - THE system SHALL return UI to neutral state.
   - The vote action is abandoned.

**Scenario: Community Admin Votes on Their Own Post**

1. An admin user creates a post.
2. Admin clicks ▲ on their own post.
3. THE system SHALL:
   - Treat the admin as a member in this context.
   - Prevent the vote.
   - Display: "You can’t vote on your own posts/comments."
4. Admin cannot override this restriction — even admins are subject to ownership rules for voting.

**Scenario: Invalid State Transition Attempt (e.g., Clicking Upvote Twice)**

1. User has already upvoted a post.
2. User clicks Upvote button again.
3. THE system SHALL behave identically to "Reversing Vote to None" (Scenario in Main).
4. No error condition is triggered — this is the standard, expected behavior.

### Post-action Outcomes

- **Immediate outcome**: The user’s vote state is visually reflected on the item card or comment thread, with score updated without delay.
- **Persistent outcome**: The vote is recorded in the backend and counts toward the item’s final score for sorting (Newest, Top).
- **Downstream effect**: The item’s position in the Home feed (sorted by Top) may rise or fall in subsequent paginated loads, based on updated score.
- **Data integrity**: The system prevents vote inflation — a single user contributes only one vote per item at a time.
- **User satisfaction**: Users perceive the system as responsive and consistent. No confusion arises over why a vote disappeared — the state change is transparent.
- **Session recovery**: If the user leaves and returns later, the vote state is preserved (if session is active) or must be re-established after login.
- **Moderation alignment**: The vote behavior reinforces community consensus, not authority — even admins are bound by the same rule against self-voting.

### Mermaid Diagram: Vote State Machine

```mermaid
stateDiagram-v2
  [*] --> "No Vote"
  "No Vote" --> "Upvote": Click Upvote
  "No Vote" --> "Downvote": Click Downvote
  "Upvote" --> "No Vote": Click Upvote
  "Upvote" --> "Downvote": Click Downvote
  "Downvote" --> "No Vote": Click Downvote
  "Downvote" --> "Upvote": Click Upvote
```

> *Developer Note: This document defines **business requirements only**. All technical implementations (architecture, APIs, database design, etc.) are at the discretion of the development team.