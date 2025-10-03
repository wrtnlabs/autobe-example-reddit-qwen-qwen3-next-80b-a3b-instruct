import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_post_vote_state_retrieval_after_multiple_votes(
  connection: api.IConnection,
) {
  // --- Setup: Authenticate member ---
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // --- Setup: Create community ---
  const communityName: string = RandomGenerator.name()
    .replace(/\s+/g, "-")
    .toLowerCase();
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

  // --- Setup: Create post ---
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: RandomGenerator.paragraph({
          sentences: 5,
          wordMin: 3,
          wordMax: 8,
        }),
        body: RandomGenerator.content({
          paragraphs: 2,
          sentenceMin: 10,
          sentenceMax: 15,
          wordMin: 3,
          wordMax: 8,
        }),
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // --- Test 1: First vote - UPVOTE ---
  await api.functional.communityPlatform.member.posts.votes.create(connection, {
    postId: post.id,
    body: {
      vote_state: "upvote",
    } satisfies ICommunityPlatformPost.ICreateVote,
  });

  // --- Verify vote state after UPVOTE ---
  const voteStateAfterUpvote: ICommunityPlatformPost.IVoteState =
    await api.functional.communityPlatform.member.posts.votes.index(
      connection,
      {
        postId: post.id,
        body: {
          page: 1,
          limit: 20,
        } satisfies ICommunityPlatformPost.IRequest,
      },
    );
  typia.assert(voteStateAfterUpvote);
  TestValidator.equals(
    "post vote state should be 'upvote' after upvoting",
    voteStateAfterUpvote.state,
    "upvote",
  );

  // --- Test 2: Toggle vote - DOWNVOTE ---
  await api.functional.communityPlatform.member.posts.votes.create(connection, {
    postId: post.id,
    body: {
      vote_state: "downvote",
    } satisfies ICommunityPlatformPost.ICreateVote,
  });

  // --- Verify vote state after DOWNVOTE ---
  const voteStateAfterDownvote: ICommunityPlatformPost.IVoteState =
    await api.functional.communityPlatform.member.posts.votes.index(
      connection,
      {
        postId: post.id,
        body: {
          page: 1,
          limit: 20,
        } satisfies ICommunityPlatformPost.IRequest,
      },
    );
  typia.assert(voteStateAfterDownvote);
  TestValidator.equals(
    "post vote state should be 'downvote' after toggling to downvote",
    voteStateAfterDownvote.state,
    "downvote",
  );

  // --- Test 3: Toggle vote again - REMOVE VOTE ('none') ---
  await api.functional.communityPlatform.member.posts.votes.create(connection, {
    postId: post.id,
    body: {
      vote_state: "downvote",
    } satisfies ICommunityPlatformPost.ICreateVote,
  });

  // --- Verify vote state after removing vote (should be 'none') ---
  const voteStateAfterRemove: ICommunityPlatformPost.IVoteState =
    await api.functional.communityPlatform.member.posts.votes.index(
      connection,
      {
        postId: post.id,
        body: {
          page: 1,
          limit: 20,
        } satisfies ICommunityPlatformPost.IRequest,
      },
    );
  typia.assert(voteStateAfterRemove);
  TestValidator.equals(
    "post vote state should be 'none' after removing vote",
    voteStateAfterRemove.state,
    "none",
  );
}
