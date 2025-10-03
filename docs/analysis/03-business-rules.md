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
3. **Content Cross-Promotion**: The globally visible "Latest Posts" sidebar creates organic traffic between communities, encouraging cross-pollination of audiences.
4. **Search Engine Optimization**: Content within communities is designed to be naturally indexable, making expert discussions discoverable via search engines.
5. **Integration with Knowledge Platforms**: Partnerships with academic institutions, open-source projects, and educational resources to embed community links in content repositories.

User retention will be driven by habit formation through the "Recent Communities" sidebar, daily personalized content discovery, and the psychological reward of meaningful community interaction.

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

## Key Features Summary

The Community Platform delivers the following core functionalities:

- **Topic-Based Sub-Communities**: Users can create and join communities centered on niche topics, with unique names formed from alphanumeric characters, hyphens, and underscores.
- **Open Reading, Controlled Participation**: All content is accessible to everyone; posting, commenting, voting, community creation, and membership require user authentication.
- **Personalized Main Feed**: The homepage prioritizes content from communities a user has joined, sorted by "Newest" or "Top" using community-driven scoring mechanisms.
- **Global Latest Sidebar**: A consistent right sidebar displays the 10 most recent posts across the entire platform, promoting serendipitous discovery.
- **Persistent Navigation**: Every page features a fixed left sidebar with navigation to Home, Explore, and Create, plus a dynamic Recently Visited Communities list.
- **User-Driven Voting System**: A one-tap upvote/downvote system where users can toggle between "None," "Upvote," and "Downvote," with scores calculated as upvotes minus downvotes.
- **Comment Threads**: Nested comment threads support conversational depth without fragmentation.
- **Community Ownership**: Only the original creator can edit community metadata (description, rules, logo); community name is immutable.
- **Account-Based Content Ownership**: Users may only edit or delete content they authored.
- **Session Resumption**: Expired sessions prompt seamless re-authentication without losing context.
- **Optimistic UI Updates**: Interface updates apply immediately (e.g., vote state, join status) with backend syncing occurring asynchronously.
- **Flexible Search**: Comprehensive search across posts, communities, and comments with per-category sorting options.
- **Friendly Relative Time Display**: All timestamps are rendered in the user’s local timezone (Asia/Seoul) using natural language (e.g., "5 minutes ago").

## User Roles Introduction

The platform implements three distinct user roles with clearly defined permissions:

- **Guest**: An unauthenticated user with read-only access to all public content. Guests can browse posts, view communities, and read comments but cannot post, comment, vote, join communities, or create anything.
- **Member**: An authenticated user who can create and manage their own posts and comments, upvote/downvote content, join or leave communities, and create new sub-communities under predefined naming rules. Members own their content and may edit or delete it only.
- **Admin**: A system-appointed role with elevated privileges including the ability to delete communities, intervene in abusive behavior, enforce community rules, manage flagged content, and override content ownership when necessary to protect platform integrity. Admins have full Member privileges.

Each role's permissions are enforced at the business logic layer, ensuring that no technical vulnerability can grant unauthorized access.

## Document Navigation Guide

This document serves as the foundational overview for the entire project. The following documents provide increasingly specific technical and operational details:

- **[User Roles and Permissions](./01-user-roles.md)**: A comprehensive breakdown of permissions for each user role, including authentication workflow and token structure.
- **[Functional Requirements](./02-functional-requirements.md)**: Detailed prescriptions of every required user-facing action, written in EARS format for unambiguous implementation.
- **[Business Rules](./03-business-rules.md)**: All input validation, display formatting, session handling, and operational constraints governing system behavior.
- **[User Journey: Home Feed](./04-user-journey-home.md)**: Step-by-step walkthrough of how users experience the homepage under different conditions.
- **[User Journey: Explore Communities](./05-user-journey-explore.md)**: Full user journey for discovering and joining new communities.
- **[User Journey: Create Community](./06-user-journey-create-community.md)**: Process from initiation to completion and aftermath of creating a new community.
- **[User Journey: Create Post](./07-user-journey-create-post.md)**: End-to-end flow for composing and submitting posts.
- **[User Journey: Comments](./08-user-journey-comments.md)**: Design of the nested commenting system, including UI and backend state transitions.
- **[User Journey: Voting](./09-user-journey-voting.md)**: Complete behavioral specification of the upvote/downvote system, including edge cases.
- **[User Journey: Search](./10-user-journey-search.md)**: Behavior of the search function across all result types with sorting and pagination rules.

All documents are structured to be read in sequence, with each building upon the previous for maximum clarity and completeness.

> *Developer Note: This document defines **business requirements only**. All technical implementations (architecture, APIs, database design, etc.) are at the discretion of the development team.*