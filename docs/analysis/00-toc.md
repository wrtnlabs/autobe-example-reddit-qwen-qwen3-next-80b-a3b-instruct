# Table of Contents

This document provides a structured overview of the complete documentation set for the Community BBS platform. All other documents are organized in a logical sequence to support understanding from business context to technical requirements.

## 1. Service Overview

[Service Overview](./01-service-overview.md)

Defines the purpose, scope, and goals of the Community BBS platform. This section explains why the service exists, who it serves, and what value it delivers to users — without technical details.

## 2. Business Model

[Business Model](./02-business-model.md)

Outlines the commercial viability and strategic foundation of the platform. This includes target market, revenue potential, user acquisition strategy, growth expectations, and measurable success KPIs.

## 3. User Roles and Permissions

[User Roles](./03-user-roles.md)

Details the three user roles — guest, member, and administrator — and their distinct permissions across all platform features. Specifies exactly what each role can and cannot do in natural language.

## 4. Functional Requirements

[Functional Requirements](./04-functional-requirements.md)

Comprehensively lists all system behaviors in natural language using EARS format where applicable. Covers every core feature including sub-communities, posts, comments, voting, sorting, pagination, search, and authentication.

## 5. User Interaction Journeys

### 5.1 Home Feed Experience

[User Journey: Home](./05-user-journey-home.md)

Maps the complete experience of viewing and interacting with the home feed — from initial page load to filtering by sort order, joining communities, and handling login prompts.

### 5.2 Sub-Community Interaction

[User Journey: Community](./06-user-journey-community.md)

Describes the end-to-end flow for discovering, joining, and engaging with sub-communities, including viewing community rules and posting content.

### 5.3 Global Search

[User Journey: Search](./07-user-journey-search.md)

Details the search process across posts, sub-communities, and comments, including tab switching, default sort behavior, and result pagination.

### 5.4 Community Creation

[User Journey: Create Community](./08-user-journey-create.md)

Outlines the step-by-step flow for creating a new sub-community, from clicking the Create button to successful redirection and name validation.

## 6. Error Handling

[Error Handling](./09-error-handling.md)

Documents all user-facing error conditions — including login required, permission denied, validation errors, system failures, and session expiry — with corrective actions and standardized messaging.

## 7. Performance Expectations

[Performance Expectations](./10-performance-expectations.md)

Defines measurable user experience requirements for speed, responsiveness, and perceived performance — such as interaction latency, loading states, and optimistic UI behavior — without specifying technical architecture.

> *Developer Note: This document defines **business requirements only**. All technical implementations (architecture, APIs, database design, etc.) are at the discretion of the development team.