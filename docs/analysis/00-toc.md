# Service Overview

The Community Platform is a distributed, interest-based social networking service designed to empower users to form and participate in topic-specific communities. Unlike centralized social media platforms, this service emphasizes organic community formation, user-driven content discovery, and decentralized moderation through collective upvoting and downvoting mechanisms. The platform's core innovation lies in its ability to surface quality content through peer validation rather than algorithmic amplification, creating a more authentic and sustainable discussion environment.

## Business Model

### Why This Service Exists

The modern digital information landscape is characterized by content saturation, algorithmic bias, and declining trust in centralized platforms. Users increasingly crave spaces where they can engage with niche topics without interference from profit-driven feeds or echo chambers. This service fills a critical market gap by providing a Reddit-like experience optimized for clarity, user autonomy, and community self-governance. Unlike competing platforms that prioritize engagement metrics over content quality or impose monetization structures that compromise user experience, this platform places control firmly in the hands of its users.

The primary market opportunity exists among knowledge workers, lifelong learners, hobbyists, and creative professionals who seek authentic peer-to-peer knowledge sharing without corporate surveillance or manipulative UI patterns. Competitors such as Reddit, Discord, and niche forums provide partial solutions but suffer from inconsistent user experiences, poor discovery mechanisms, or overly complex moderation tools. This platform differentiates itself by offering a cohesive, intuitive, and highly performant interface with built-in community-building tools that require no technical expertise to use.

### Revenue Strategy

The service operates as a freemium model with zero advertising. Revenue is generated through voluntary micro-donations and optional premium membership features:

- **Micro-donations**: Users can send small monetary contributions to community curators, exceptional content creators, or entire communities they value. Donations are processed through secure third-party payment providers with 100% of proceeds flowing to recipients.
- **Premium Membership (optional)**: A subscription tier provides enhanced discovery tools, advanced community analytics, early access to new features, and the ability to customize community appearance with proprietary themes and layout options. Premium features are entirely optional and do not affect content visibility or algorithmic sorting.

The platform is structured to require no advertising, affiliate marketing, or data monetization to remain financially sustainable. This reinforces the core value proposition of user privacy and autonomy.

### Growth Plan

User acquisition will be driven through five primary channels:

1. **Community Seed Networks**: Early adopters in key interest areas (Tech, Science, Art) will be invited to establish foundational communities that serve as anchors in the network.
2. **Referral Incentives**: Users who invite others who then join and engage with communities will receive enhanced community visibility badges.
3. **Content Cross-Promotion**: The globally visible “Latest Posts” sidebar creates organic traffic between communities, encouraging cross-pollination of audiences.
4. **Search Engine Optimization**: Content within communities is designed to be naturally indexable, making expert discussions discoverable via search engines.
5. **Integration with Knowledge Platforms**: Partnerships with academic institutions, open-source projects, and educational resources to embed community links in content repositories.

User retention will be driven by habit formation through the “Recent Communities” sidebar, daily personalized content discovery, and the psychological reward of meaningful community interaction.

### Success Metrics

The following key performance indicators will be tracked to measure success:

- **Daily Active Users (DAU)**: Target 50,000 within 12 months
- **Monthly Active Users (MAU)**: Target 250,000 within 18 months
- **Average Sessions per User**: Average of 4.5 sessions per day (reinforcing habit formation)
- **Community Creation Rate**: 500+ new communities created per week
- **Content Engagement Rate**: Average of 8.3 comments per top post
- **Donation Conversion Rate**: 8% of registered users make at least one micro-donation annually
- **Retention Rate (30-day)**: 45% of new users return after 30 days
- **Community Longevity**: 70% of created communities remain active after 90 days

## Core Principles

1. **Reading is open to everyone.** All content is accessible to unauthenticated users. Posting, commenting, voting, creating sub-communities, and joining/leaving communities require authentication.
2. **Keep the login session generously long.** When a session expires, the system SHALL prompt the user for re-authentication without interrupting the current screen or navigation context.
3. **Ownership is account-based.** Users MAY edit or delete only posts or comments they authored. Ownership is determined through authenticated user identifier matching in the backend.
4. **Minimize validation and prioritize smooth, error-free user flows and UI behavior.** The system SHALL use optimistic UI updates for all user actions, presenting immediate feedback before backend synchronization.

## Major Features

### Sub-Communities

- **Name**: Community names SHALL be short, readable alphanumeric strings that MAY include hyphens (-) and underscores (_). Names SHALL be unique across the entire system.
- **Description**: A optional summary text field with a maximum length of 500 characters.
- **Logo/Banner**: Community MAY have an optional logo (PNG, JPG, SVG) and banner (PNG, JPG) image. If not provided, the system SHALL display a default placeholder image.
- **Rules**: Optional rules in text form, with a maximum of 20 rules permitted. The system SHALL display only the top 5 rules on community pages with numbering (1., 2., 3., etc.).
- **Create**: When a member clicks the Create button, THE system SHALL validate the community name against uniqueness and format constraints before creation. Creation SHALL be permitted for any authenticated user with member role.
- **Edit**: Only the original creator of the community SHALL be permitted to edit its description, logo, banner, or rules. The community name SHALL be immutable after creation.
- **Member Count**: The system SHALL display the real-time count of users who have joined the community. The count SHALL be decreased when a user leaves the community and increased when a user joins. Numbers of 1000 or more SHALL use abbreviation (e.g., 1000 → 1k, 10000 → 10k, 1000000 → 1m).
- **Category**: Each community SHALL be assigned exactly one category from the predefined list: [Tech & Programming] [Science] [Movies & TV] [Games] [Sports] [Lifestyle & Wellness] [Study & Education] [Art & Design] [Business & Finance] [News & Current Affairs].
- **Delete**: When a community is deleted by its creator or an admin, THE system SHALL cascade-delete all associated posts and comments and remove the community from all users' “Recent Communities” lists.

### Join / Leave

- The community page SHALL display a button that toggles between “Join” and “Joined” states.
- WHEN a user clicks “Join”, THE system SHALL:
  - Immediately update the user’s membership record in the database to include the community
  - Immediately update the button label to “Joined”
  - Immediately update the user’s “Recent Communities” sidebar list (if fewer than 5 items, or if newer than the existing 5th community)
  - Include future posts from this community in the user’s Home feed
- WHEN a user clicks “Joined”, THE system SHALL:
  - Immediately update the user’s membership record to exclude the community
  - Immediately update the button label to “Join”
  - Immediately remove the community from the “Recent Communities” list if it was present
  - Exclude future posts from this community in the user’s Home feed
- The “Recent Communities” list SHALL display at most 5 communities, ordered by most recent activity (e.g., join, vote, comment, post).
- Joining a community SHALL NOT confer moderation, admin, or administrative privileges.

### Posts

- **Type**: Text-only format, consisting of a title and body.
- **Composition rules**:
  - Selecting a target sub-community SHALL be mandatory before submission.
  - **Title**: SHALL be 5–120 characters inclusive.
  - **Body**: SHALL be 10–10,000 characters inclusive and SHALL contain only plain text with allowed line breaks (\n). No scripts, code, HTML, CSS, or executable content SHALL be permitted.
  - **Author display name**: Optional field. If empty or null, the system SHALL display “Anonymous” as the author name.
- **Card display fields** (shown in feeds and search results):
  - Community name (e.g., "/c/ai")
  - Post title
  - Author name (or "Anonymous" if not set)
  - Created time (relative format: e.g., "5 minutes ago")
  - Comment count (numeric, abbreviated if ≥1000)
  - Score (upvotes minus downvotes)
- **Permissions**: Only the authenticated user who created the post MAY edit or delete that post. The system SHALL not display edit/delete controls to any other user.
- **Membership requirement**: Posting does NOT require prior membership in the target community.

### Comments

- **Create/Edit/Delete** require authentication and SHALL be permitted only for the comment's original author.
- **Length**: SHALL be 2–2,000 characters inclusive.
- **Structure**: Supports unlimited levels of nested replies. Comment threads SHALL be ordered by creation time descending, with ties broken by higher numeric post identifier.
- **Display**: Comments SHALL appear as threaded responses under the parent post or comment.
- **Serialization**: The backend SHALL persist full comment tree relationships, with reference to parent IDs for nesting.

### Voting

- Each user SHALL have only one voting state per post or comment: "None", "Upvote", or "Downvote".
- The voting state transition model is as follows:
  - "None" → "Upvote" when Upvote button is clicked
  - "None" → "Downvote" when Downvote button is clicked
  - "Upvote" → "None" when Upvote button is clicked again
  - "Downvote" → "None" when Downvote button is clicked again
  - "Upvote" → "Downvote" when Downvote button is clicked
  - "Downvote" → "Upvote" when Upvote button is clicked
- The score for each post or comment SHALL be calculated as: (number of Upvotes) minus (number of Downvotes).
- Users SHALL NOT be permitted to vote on their own posts or comments. The system SHALL disable UI vote buttons and display the message: "You can't vote on your own posts/comments." when attempted.
- Vote state changes SHALL be applied optimistically in the UI before the server confirms the change.
- If the server returns an error, the UI SHALL revert to the previous state and display: "A temporary error occurred. Please try again in a moment."

### Sorting & Pagination

- **Sort orders**:
  - **Newest**: Sort by creation timestamp descending. If creation times are equal, sort by post/comment numeric identifier descending.
  - **Top**: Sort by score (upvotes - downvotes) descending. If scores are equal, sort by creation timestamp descending. If creation times are also equal, sort by numeric identifier descending.
- **Pagination**:
  - **Main feeds** (Home, Community Home): SHALL show exactly 20 cards per page. When users click "[Load more]", the system SHALL append the next 20 items from the sorted list.
  - **Right sidebar Global Latest**: SHALL display exactly 10 of the most recently created posts across all communities, without pagination.

### Search

- **Post search**: Match query against post title AND body. Minimum query length: 2 characters. Default sort: Newest.
- **Sub-community search**: Match query against community name and description. Minimum query length: 2 characters.
- **Comment search**: Match query against comment body. Minimum query length: 2 characters. Sort by Newest only.
- **Results display**:
  - All result types SHALL return 20 entries per page.
  - Search results SHALL be presented in three tabs: Posts (default), Sub-Communities, and Comments.
  - Empty state message: "No matching results. Try different keywords."
  - Placeholder message for queries under 2 characters: "Please enter at least 2 characters."

## Information Architecture & Layout

### Global Layout (All Pages)

- **Left Sidebar (fixed)**:
  - Contains global navigation buttons: "Home", "Explore", "Create".
  - Contains a dynamic "Recent Communities" list displaying up to 5 communities ordered by most recent user interaction (join, post, comment, vote). Each entry displays the community name and a small logo (default if none exists). Clicking an item navigates to "/c/[name]".
- **Main Content Area**: Displays the primary page content.
- **Right Sidebar**:
  - On Home page: Displays Global Latest posts (10 most recent across all communities).
  - On Community Home and Post Detail pages: Displays Community Info + Rules box containing the community’s description, creation date (optional), last active (optional), and community rules.

### Sitemap

```
[HOME] /                         — Unified feed (prioritizes joined communities)
 ├─ /submit                      — Global post composer (choose community, login required)
 ├─ /s                           — Global search (sub-communities / posts / comments)
 ├─ /c                           — Explore sub-communities
 │   ├─ /c/create                — Create a sub-community (login required)
 │   ├─ /c/[name]                — Specific sub-community home
 │   │   ├─ /c/[name]/submit     — Post directly to this community (login required)
 │   │   └─ /c/[name]/[postID]   — Post detail + comments
 └─ /login                       — Login (modal; overlays on any screen)
```

### Screens (by Page)

#### A) Home

/ — Primary feed of communities joined by the user.

- **Left Sidebar**:
  - Home, Explore, Create buttons
  - Recent Communities (up to 5, ordered by most recent activity)
- **Navbar**:
  - Logo (to Home)
  - Global search input
  - Create (post) button
  - Profile dropdown (Settings and Logout)
- **Main Content**:
  - Sort control: Dropdown menu with [Newest] | [Top] options
    - [Newest]: Uses the Newest sort rules
    - [Top]: Uses the Top sort rules
  - Post cards list (20 items), each showing community name, title, author, time (relative format), comment count, score
  - "[Load more]" button to load next 20 post cards
  - If no communities joined: Display guidance message and show global posts sorted by Newest or Top
  - If authentication fails during any interaction: Prompt login modal, then resume action upon success
- **Right Sidebar — Global Latest**:
  - Header: "Global Latest"
  - Content: 10 of the most recently posted items across all communities
  - Each item: Community name, single-line title (ellipsized if long), time (relative format)

#### B) Sub-Community Home

c/[name]

- **Left Sidebar**:
  - Home, Explore, Create buttons
  - Recent Communities (up to 5)
- **Navbar**:
  - Logo (to Home)
  - Global search input
  - Create post button
  - Profile dropdown
- **Main Content**:
  - Header: Community logo (if any), community name, "Join" (or "Joined") button
  - Sort toggle: [Newest] | [Top]
  - Post composer (visible if logged in)
  - Post cards list (20 items), sorted by selected criteria
  - "[Load more]" button to load next 20
- **Right Sidebar — Community Info + Rules**:
  - Info box (top):
    - Community name
    - Short description
    - Created date (optional)
    - Last active (optional)
    - Rules:
      - Section title: "Community Rules"
      - Display only first 5 rules, numbered as 1., 2., 3. etc.
      - Each rule limited to 2 lines (~50 characters)
      - If more than 5 rules exist, display "Show all rules" link

#### C) Post Detail

c/[name]/[postID]

- **Left Sidebar**:
  - Home, Explore, Create buttons
  - Recent Communities (up to 5)
- **Navbar**:
  - Logo (to Home)
  - Global search input
  - Create post button
  - Profile dropdown
- **Main Content**:
  - Top: Community mini-info (logo, name) + "Back" button
  - Body: Post title, author, time, post content
  - Score (upvotes - downvotes) and comment count
  - Comments:
    - Comment composer (visible if logged in)
    - 20 comments displayed with nested replies
    - "[Load more]" button to load next 20
  - Edit/Delete buttons visible only for post author
- **Right Sidebar — Community Info + Rules**:
  - Same structure and display rules as Sub-Community Home

#### D) Global Post Composer

/submit

- **Left Sidebar**:
  - Home, Explore, Create buttons
  - Recent Communities (up to 5)
- **Navbar**:
  - Logo (to Home)
  - Global search input
  - Create post button
  - Profile dropdown
- **Main Content**:
  - Fields (in order):
    - [Community selector dropdown]
    - [Title text input]
    - [Body text area]
    - [Author display name (optional) text input]
    - [Submit button]
  - If user attempts submission while logged out: MuD

#### E) Create a Community

c/create

- **Left Sidebar**:
  - Home, Explore, Create buttons
  - Recent Communities (up to 5)
- **Navbar**:
  - Logo (to Home)
  - Global search input
  - Create post button
  - Profile dropdown
- **Main Content**:
  - Fields:
    - [Name input]
    - [Description textarea]
    - [Logo upload button]
    - [Banner upload button]
    - [Rules textarea]
    - [Category dropdown]
    - [Create button]
  - On success: Redirect to "/c/[name]"

#### F) Global Search

/s

- **Left Sidebar**:
  - Home, Explore, Create buttons
  - Recent Communities (up to 5)
- **Navbar**:
  - Logo (to Home)
  - Global search input (focused and persistent)
  - Create post button
  - Profile dropdown
- **Main Content**:
  - Search header:
    - Large search input with placeholder: "Search communities, posts, and comments (2+ characters)"
    - [Search] button
  - Three result tabs:
    1. **Posts** (default)
      - Sort dropdown: [Newest] | [Top]
      - 20 cards shown → "[Load more]" loads next 20
      - Card fields:
        - Community name
        - Title
        - Body excerpt (2 lines, ellipsis)
        - Author
        - Time (relative)
        - Comment count
        - Score
    2. **Sub-Communities**
      - Sort dropdown: [Name Match] | [Recently Created]
      - 20 cards shown → "[Load more]" loads next 20
      - Card fields:
        - Community name
        - Description (2 lines, ellipsis)
        - Logo (if any)
        - [Join | Joined] button
    3. **Comments**
      - Sort dropdown: [Newest] (locked)
      - 20 comment snippets shown → "[Load more]" loads next 20
      - Item fields:
        - Comment content (2 lines, ellipsis)
        - Author
        - Time (relative)
        - Parent post title (linked)
        - Community name
  - Empty states:
    - "Please enter at least 2 characters."
    - "No matching results. Try different keywords."

#### G) Explore Sub-Communities

c

- **Left Sidebar**:
  - Home, Explore, Create buttons
  - Recent Communities (up to 5)
- **Navbar**:
  - Logo (to Home)
  - Global search input
  - Create post button
  - Profile dropdown
- **Main Content**:
  - Category chips: [Tech & Programming] [Science] [Movies & TV] [Games] [Sports] [Lifestyle & Wellness] [Study & Education] [Art & Design] [Business & Finance] [News & Current Affairs]
  - Community grid:
    - 20 cards shown → "[Load more]" loads next 20
    - Card fields:
      - Top: Logo (if any) + community name + member count
      - Body: Description (2 lines, ellipsis)
      - Bottom: [Join | Joined] button

#### H) Community-Specific Post Composer

c/[name]/submit

- Same as global composer, but with community pre-selected (disabled and hidden dropdown).

#### I) Login & Sign Up

/login (modal)

- Modal content:
  - Login box with inputs:
    - User identifier (email or username)
    - Password
  - Primary buttons: [Sign in] and [Sign up]
  - Error handling:
    - On failure: "Login failed. Please try again."
    - No lockout or excessive delay on multiple failures
  - On success:
    - Login modal closes
    - User is redirected to the page and action they were attempting before login (e.g., posting, commenting, joining)

## Interaction Rules

- **Guest guard**: When a guest attempts any authenticated action (posting, commenting, voting, creating, joining), THE system SHALL display "Please sign in to continue." and open a login modal overlay without redirecting the page.
- **Author guard**: Edit/Delete buttons SHALL be shown ONLY for items authored by the current user. WHEN a non-author attempts to edit/delete, the system SHALL display: "You can edit or delete only items you authored."
- **Join/Leave**: When a user toggles the Join/Joined button, the UI SHALL immediately reflect:
  - Button state change
  - Recent Communities list update
  - Post visibility updates in Home feed
- **Session expiry**: When a session expires during an action, THE system SHALL display a non-intrusive banner: "Your session has expired. Please sign in to continue." and open a login modal. Upon successful login, the original action SHALL resume.
- **Optimistic UI**: All UI updates for upvotes, downvotes, comment counts, and join status SHALL be applied immediately in the interface. Backend sync SHALL occur asynchronously. If sync fails, the UI SHALL revert to the previous state and display: "A temporary error occurred. Please try again in a moment."

## Input Rules

- **Community name**: Short, readable alphanumeric; hyphen/underscore allowed; maximum length 64 characters; minimum length 3 characters; no spaces or special characters other than - and _; must be unique.
- **Title**: 5–120 characters inclusive.
- **Body**: 10–10,000 characters inclusive; plain text with line breaks only; no code, scripts, HTML, CSS, or executable content.
- **Author display name**: 0–32 characters; if empty, default to "Anonymous".
- **Comment**: 2–2,000 characters inclusive.

## Display Rules & Standard Copy

- **Time format**: Use relative timestamps in user’s local timezone (Asia/Seoul): "just now", "X minutes ago", "X hours ago", "X days ago", or "MMM DD, YYYY" for 30+ days.
- **Number abbreviations**: 1,000 → 1k / 10,000 → 10k / 100,000 → 100k / 1,000,000 → 1m / 10,000,000 → 10m
- **Standard messages**:
  - Login required: "Please sign in to continue."
  - No permission: "You can edit or delete only items you authored."
  - Community name taken: "This name is already in use."
  - Invalid community name format: "This name isn’t available. Please choose something simpler."
  - No community selected: "Please choose a community to post in."
  - Query too short: "Please enter at least 2 characters."
  - Self-vote: "You can't vote on your own posts/comments."
  - Temporary error: "A temporary error occurred. Please try again in a moment."

> *Developer Note: This document defines **business requirements only**. All technical implementations (architecture, APIs, database design, etc.) are at the discretion of the development team.