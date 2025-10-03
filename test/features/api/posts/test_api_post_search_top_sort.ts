import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformCommunityPlatformPostIRequest } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunityPlatformPostIRequest";
import type { ICommunityPlatformCommunityPlatformPostISummary } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunityPlatformPostISummary";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageICommunityPlatformCommunityPlatformPostISummary } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunityPlatformCommunityPlatformPostISummary";

export async function test_api_post_search_top_sort(
  connection: api.IConnection,
) {
  // Step 1: Authenticate a member user
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // Step 2: Create a community
  const communityName: string = RandomGenerator.alphaNumeric(10);
  const community: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: communityName,
          category: "Tech & Programming",
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(community);

  // Step 3: Create multiple posts with different timestamps and scores
  const post1: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: "Post with most votes",
        body: "This post has the highest upvote count.",
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post1);

  // Delay to ensure different created_at timestamps
  await new Promise((resolve) => setTimeout(resolve, 100));

  const post2: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: "Post with medium votes",
        body: "This post has medium upvote count.",
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post2);

  await new Promise((resolve) => setTimeout(resolve, 100));

  const post3: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: "Post with no votes",
        body: "This post has no votes.",
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post3);

  // Step 4: Cast votes to establish different scores
  // Post 1: 5 upvotes
  await api.functional.communityPlatform.member.posts.votes.create(connection, {
    postId: post1.id,
    body: { vote_state: "upvote" } satisfies ICommunityPlatformPost.ICreateVote,
  });
  await api.functional.communityPlatform.member.posts.votes.create(connection, {
    postId: post1.id,
    body: { vote_state: "upvote" } satisfies ICommunityPlatformPost.ICreateVote,
  });
  await api.functional.communityPlatform.member.posts.votes.create(connection, {
    postId: post1.id,
    body: { vote_state: "upvote" } satisfies ICommunityPlatformPost.ICreateVote,
  });
  await api.functional.communityPlatform.member.posts.votes.create(connection, {
    postId: post1.id,
    body: { vote_state: "upvote" } satisfies ICommunityPlatformPost.ICreateVote,
  });
  await api.functional.communityPlatform.member.posts.votes.create(connection, {
    postId: post1.id,
    body: { vote_state: "upvote" } satisfies ICommunityPlatformPost.ICreateVote,
  });

  // Post 2: 3 upvotes
  await api.functional.communityPlatform.member.posts.votes.create(connection, {
    postId: post2.id,
    body: { vote_state: "upvote" } satisfies ICommunityPlatformPost.ICreateVote,
  });
  await api.functional.communityPlatform.member.posts.votes.create(connection, {
    postId: post2.id,
    body: { vote_state: "upvote" } satisfies ICommunityPlatformPost.ICreateVote,
  });
  await api.functional.communityPlatform.member.posts.votes.create(connection, {
    postId: post2.id,
    body: { vote_state: "upvote" } satisfies ICommunityPlatformPost.ICreateVote,
  });

  // Post 3: 0 votes (already set)

  // Step 5: Search posts with sort=top and verify ordering
  // Wait for any potential cache/sync delays
  await new Promise((resolve) => setTimeout(resolve, 500));

  const searchRequest: ICommunityPlatformCommunityPlatformPostIRequest = {
    query: "", // Search all posts
    sort: "top", // Sort by top score
    page: 1,
    limit: 20,
  };

  const searchResponse: IPageICommunityPlatformCommunityPlatformPostISummary =
    await api.functional.communityPlatform.posts.search(connection, {
      body: searchRequest,
    });
  typia.assert(searchResponse);

  // Verify we have 3 posts in response
  TestValidator.equals("response has 3 posts", searchResponse.data.length, 3);

  // Verify the order is by descending score: post1 (score: 5) > post2 (score: 3) > post3 (score: 0)
  TestValidator.equals(
    "first post has highest score",
    searchResponse.data[0].score,
    5,
  );
  TestValidator.equals(
    "second post has medium score",
    searchResponse.data[1].score,
    3,
  );
  TestValidator.equals(
    "third post has lowest score",
    searchResponse.data[2].score,
    0,
  );

  // Verify post IDs match expected
  TestValidator.equals("first post ID", searchResponse.data[0].id, post1.id);
  TestValidator.equals("second post ID", searchResponse.data[1].id, post2.id);
  TestValidator.equals("third post ID", searchResponse.data[2].id, post3.id);

  // Verify community names match
  TestValidator.equals(
    "first post community name",
    searchResponse.data[0].community_name,
    communityName,
  );
  TestValidator.equals(
    "second post community name",
    searchResponse.data[1].community_name,
    communityName,
  );
  TestValidator.equals(
    "third post community name",
    searchResponse.data[2].community_name,
    communityName,
  );
}
